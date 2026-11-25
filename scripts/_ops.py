import json,sys,collections,os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','evidence','probe'))
def table(intent):
    s=json.load(open(f'catalogue/intent_{intent}.json'))
    api={m['id']:m for m in json.load(open(f'catalogue/apiminers_{intent}.json'))}
    rows=[]
    for m in s['miners']:
        a=api.get(m['id'],{})
        sc=[x for x in a.get('scores',[]) if x['intent_id']==intent]
        sc=sc[0] if sc else {}
        rows.append(dict(id=m['id'],slug=m['slug'],name=m['name'],mapping=m.get('mapping'),compat=m.get('compatible'),
          owner=a.get('wallet_address'),fee=a.get('fee_address'),base=a.get('base_url'),price=a.get('min_price_usdc'),
          rank=sc.get('rank'),score=sc.get('score'),served=a.get('total_requests_served'),status=a.get('activation_status'),
          ep=m.get('compatible_endpoints')))
    return rows
if __name__=='__main__':
    intent=sys.argv[1]; rows=table(intent)
    rows.sort(key=lambda r:(r['rank'] is None, r['rank'] or 0))
    for r in rows:
        print(f"{r['id']:>6} rank={r['rank']} sc={r['score']} map={r['mapping']:<4} compat={r['compat']} owner={(r['owner'] or '')[:10]} fee={(r['fee'] or '')[:10]} price={r['price']} served={r['served']} {r['slug']} | {r['base']}")
    ow=collections.Counter(r['owner'] for r in rows); fe=collections.Counter(r['fee'] for r in rows); bs=collections.Counter(r['base'] for r in rows)
    print('miners',len(rows),'distinct owners',len(ow),'distinct fee addrs',len(fe),'distinct base urls',len(bs))
    print('owners',dict(ow))
