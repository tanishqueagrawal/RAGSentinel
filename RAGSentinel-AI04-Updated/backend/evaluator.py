"""Transparent conservative heuristics for RAGSentinel; scores are not probabilities."""
from datetime import datetime, timezone
import re
from urllib.parse import urlparse
STOP=set("the a an and or but of in on at to for with from by is are was were be been being this that these those it its as we they you your their our can could should would may might not no yes about into than then also more most some any how what when where who why which latest tell give explain please".split())
CONFLICT_TERMS=("however","contrary","not true","disputed","conflicting","in contrast","inconsistent")
def tokens(s): return {w for w in re.findall(r"[a-zA-Z0-9][a-zA-Z0-9_-]{2,}",(s or "").lower()) if w not in STOP}
def overlap(a,b):
    aa,bb=tokens(a),tokens(b)
    return round(len(aa&bb)/max(1,len(aa)),3)
def _source_record(r,question):
    url=r.get("url") or r.get("href") or ""
    text=(r.get("title","")+" "+r.get("snippet","")+" "+r.get("body","")).strip()
    return {**r,"url":url,"snippet":r.get("snippet") or r.get("body") or "","relevance":overlap(question,text),"domain":(urlparse(url).netloc or r.get("domain","")).lower()}
def evaluate(question,results,target=None,search_errors=None):
    sources=[_source_record(r,question) for r in results]
    sources=[s for s in sources if s.get("url","").startswith(("http://","https://"))]
    domains={s["domain"] for s in sources if s["domain"]}
    relevant=[s for s in sources if s["relevance"]>=0.12]
    conflict_hits=sum(sum(s.get("snippet","").lower().count(t) for t in CONFLICT_TERMS) for s in relevant)
    stale=0; now=datetime.now(timezone.utc)
    for s in sources:
        try:
            dt=datetime.fromisoformat(str(s.get("published")).replace("Z","+00:00"))
            if dt.tzinfo is None: dt=dt.replace(tzinfo=timezone.utc)
            stale+=int((now-dt).days>365)
        except Exception: pass
    rel=round(min(100,(sum(s["relevance"] for s in sources)/max(1,len(sources)))*100+min(len(relevant),5)*5),1)
    corr=round(min(100,len(domains)*18+min(len(relevant),8)*4),1)
    risk=10
    if not sources: risk+=50
    if sources and not relevant: risk+=25
    if len(domains)<2: risk+=12
    if conflict_hits: risk+=min(20,conflict_hits*5)
    if stale: risk+=min(15,stale*3)
    if len(sources)<3: risk+=8
    failures=[]
    if not sources:
        why="No live search results were returned."
        if search_errors: why+=" Search provider error(s): "+"; ".join(search_errors[:2])
        failures.append({"type":"Retrieval unavailable","severity":"high","reason":why})
    elif not relevant: failures.append({"type":"Low query relevance","severity":"high","reason":"No result passed the conservative lexical relevance threshold."})
    if sources and len(domains)<2: failures.append({"type":"Low source diversity","severity":"medium","reason":"Evidence is concentrated in fewer than two domains."})
    if conflict_hits: failures.append({"type":"Possible contradiction","severity":"medium","reason":"Conflict-related language was found; inspect original sources before deciding that claims conflict."})
    if stale: failures.append({"type":"Potentially stale evidence","severity":"medium","reason":f"{stale} results exposed dates older than one year."})
    retrieval={"available":False,"contexts_found":0,"relevant_contexts":0,"relevance":None}
    generation={"available":False,"answer_found":False,"grounding_overlap":None,"diagnosis":"No target RAG endpoint is configured."}
    if target:
        contexts=target.get("contexts",[]); answer=target.get("answer","")
        scores=[overlap(question,c.get("text","") if isinstance(c,dict) else str(c)) for c in contexts]
        rel_contexts=[x for x in scores if x>=0.12]
        retrieval={"available":True,"contexts_found":len(contexts),"relevant_contexts":len(rel_contexts),"relevance":round(sum(scores)/max(1,len(scores))*100,1)}
        generation={"available":True,"answer_found":bool(answer),"grounding_overlap":None,"diagnosis":"Answer returned; grounding heuristic pending."}
        if not contexts: failures.append({"type":"Retriever returned no context","severity":"high","reason":"The connected RAG endpoint returned no retrievable contexts."})
        elif not rel_contexts: failures.append({"type":"Wrong or irrelevant chunks","severity":"high","reason":"Retrieved contexts have low lexical overlap with the question; inspect retrieval/reranking."})
        if answer and contexts:
            ctx_text=" ".join(c.get("text","") if isinstance(c,dict) else str(c) for c in contexts)
            grounding=overlap(answer,ctx_text); generation["grounding_overlap"]=round(grounding*100,1)
            if grounding<0.12:
                generation["diagnosis"]="Potential context-ignoring or unsupported answer; lexical overlap is only a weak proxy."
                failures.append({"type":"Possible context ignored / unsupported answer","severity":"high","reason":"The answer shares few content terms with retrieved context. This is a heuristic flag, not semantic entailment."})
            else: generation["diagnosis"]="Some lexical overlap with retrieved context; semantic entailment is not verified."
        elif not answer: failures.append({"type":"Generator returned no answer","severity":"high","reason":"The target endpoint response had no recognized answer field."})
    if not failures: failures.append({"type":"No obvious heuristic failure","severity":"low","reason":"Basic checks passed; this does not prove correctness."})
    risk=min(100,risk); status="NO EVIDENCE" if not sources else ("HIGH RISK" if risk>=60 else ("REVIEW" if risk>=35 else "SUPPORTED — VERIFY"))
    flow=[{"name":"Parallel live search","state":"done" if sources else "warning","detail":f"{len(sources)} results across {len(domains)} domains"},
          {"name":"Retriever diagnosis","state":("done" if retrieval["relevant_contexts"] else "warning") if retrieval["available"] else ("warning" if not relevant else "done"),"detail":f"{retrieval['contexts_found']} target contexts; {retrieval['relevant_contexts']} relevant" if retrieval["available"] else f"{len(relevant)} relevant web snippets by lexical heuristic"},
          {"name":"Generator diagnosis","state":"done" if generation["answer_found"] else "skipped","detail":generation["diagnosis"]},
          {"name":"Evidence / risk checks","state":"warning" if conflict_hits or stale or not sources else "done","detail":f"{conflict_hits} conflict-language hits; {stale} potentially stale results"},
          {"name":"Risk report","state":"done","detail":status}]
    return {"question":question,"created_at":datetime.now(timezone.utc).isoformat(),"sources":sorted(sources,key=lambda x:x["relevance"],reverse=True),
      "metrics":{"retrieval_relevance":rel,"source_corroboration":corr,"risk_index":risk,"sources_found":len(sources),"distinct_domains":len(domains),"relevant_snippets":len(relevant),"potentially_stale":stale},
      "retriever_diagnosis":retrieval,"generator_diagnosis":generation,"target_rag":bool(target),"status":status,"failures":failures,"flow":flow}
