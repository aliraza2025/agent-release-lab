"""Actual Opik heuristic metrics; disable analytics and all model/tracing calls."""
import os,sys,json,contextlib,importlib.metadata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
os.environ["OPIK_ANALYTICS_ENABLE"]="false"
os.environ["OPIK_TRACK_DISABLE"]="true"
os.environ["OPIK_CONFIG_PATH"]=str(ROOT/".cache/opik-local.config")
Path(os.environ["OPIK_CONFIG_PATH"]).parent.mkdir(parents=True,exist_ok=True)
Path(os.environ["OPIK_CONFIG_PATH"]).write_text("")
with contextlib.redirect_stdout(sys.stderr):
    from opik.evaluation.metrics import Equals,IsJson
def evaluate(cases):
    if not isinstance(cases,list) or not 1<=len(cases)<=100:raise ValueError("Use 1–100 cases.")
    exact=Equals(case_sensitive=True,track=False);json_metric=IsJson(track=False)
    rows=[]
    for case in cases:
        if not all(isinstance(case.get(k),str) for k in ("id","output","reference")):raise ValueError("Each case needs id, output and reference strings.")
        if len(case["output"])>10000 or len(case["reference"])>10000:raise ValueError("Case text is too long.")
        a=exact.score(output=case["output"],reference=case["reference"])
        b=json_metric.score(output=case["output"])
        rows.append({"id":case["id"],"output":case["output"],"reference":case["reference"],"exactMatch":a.value,"validJson":b.value})
    return {"engine":"Opik "+importlib.metadata.version("opik"),"mode":"Actual local deterministic metrics","cases":rows,"exactMatchRate":sum(x["exactMatch"] for x in rows)/len(rows),"validJsonRate":sum(x["validJson"] for x in rows)/len(rows),"limits":"Format and exact-match checks only. These scores do not establish factual correctness, groundedness or customer performance. No model judge or full Opik backend was invoked."}
if __name__=="__main__":
    data=json.load(sys.stdin)
    print(json.dumps(evaluate(data.get("cases")),indent=2))
