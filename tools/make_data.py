import json, csv, sys, collections
D=sys.argv[1]
wc=json.load(open(f'{D}/node_modules/world-countries/countries.json'))
pop=collections.defaultdict(dict)
for r in csv.DictReader(open(f'{D}/population/data/population.csv')):
    pop[r['Country Code']][int(r['Year'])]=float(r['Value'])
gdp=collections.defaultdict(dict)
for r in csv.DictReader(open(f'{D}/gdp/data/gdp.csv')):
    try: gdp[r['Country Code']][int(r['Year'])]=float(r['Value'])
    except: pass
out={}
for c in wc:
    k=c['cca3']
    p=pop.get(k,{}); g=gdp.get(k,{})
    py=max(p) if p else None; gy=max(g) if g else None
    gtrend=[[y,round(g[y]/1e9,2)] for y in sorted(g) if y>=2000]
    ptrend=[[y,int(p[y])] for y in sorted(p) if y>=1990 and y%5==0 or (p and y==py)]
    nat=c['name'].get('native',{})
    nk=[k for k in nat if k!='eng'] or list(nat)
    native=nat[nk[0]]['common'] if nat else c['name']['common']
    cur=[[code,v.get('name'),v.get('symbol')] for code,v in (c.get('currencies') or {}).items()]
    idd=c.get('idd',{})
    calling=[idd.get('root','')+s for s in idd.get('suffixes',[])][:3] if idd.get('root') else []
    pc = round(g[gy]/p[gy]) if gy and gy in p else None
    out[k]=dict(n=c['name']['common'],o=c['name']['official'],nv=native,a2=c['cca2'],n3=c.get('ccn3',''),
      tld=c.get('tld',[]),cur=cur,cc=calling,cap=c.get('capital',[]),r=c['region'],sr=c.get('subregion',''),
      lang=list((c.get('languages') or {}).values()),ll=c.get('latlng'),ar=c.get('area'),b=c.get('borders',[]),
      ll_=c.get('landlocked'),un=c.get('unMember'),ind=c.get('independent'),dem=(c.get('demonyms') or {}).get('eng',{}).get('m'),
      fl=c.get('flag'),
      pop=[int(p[py]),py] if py else None, gdp=[round(g[gy]/1e9,2),gy] if gy else None, pc=[pc,gy] if pc else None,
      gt=gtrend, pt=ptrend)
json.dump(out,open('countries.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out), sum(1 for v in out.values() if v['pop']), sum(1 for v in out.values() if v['gdp']))
print(out['IND']['pop'],out['IND']['gdp'],out['IND']['pc'],out['IND']['cc'])
# atlas id check
t=json.load(open(f'{D}/node_modules/world-atlas/countries-50m.json'))
by3={v['n3']:k for k,v in out.items() if v['n3']}
miss=[(g.get('id'),g['properties']['name']) for g in t['objects']['countries']['geometries'] if g.get('id') not in by3]
print('unmatched',miss)
