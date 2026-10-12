import json, glob, re, html, sys, os
FB=sys.argv[1]; WC=sys.argv[2]
wc=json.load(open(WC))
bytld={}
for c in sorted(wc,key=lambda c:(not c.get('unMember'),not c.get('independent'))):
    for t in c.get('tld',[]): bytld.setdefault(t.lower(),c['cca3'])
byname={c['name']['common'].lower():c['cca3'] for c in wc}
for c in wc:
    for a in c.get('altSpellings',[]): byname.setdefault(a.lower(),c['cca3'])
def clean(s, n=900):
    s=re.sub(r'<br\s*/?>',' · ',s); s=re.sub(r'</p>\s*<p>','\n\n',s); s=re.sub(r'<[^>]+>','',s); s=html.unescape(s).strip(' ·\n')
    s=re.sub(r'\s+·\s+·\s+',' · ',s)
    return s if len(s)<=n else s[:n].rsplit(' ',1)[0]+' …'
def txt(v,n=900):
    if isinstance(v,dict):
        if 'text' in v and isinstance(v['text'],str): return clean(v['text'],n)
        parts=[]
        for k,sv in v.items():
            if isinstance(sv,dict) and isinstance(sv.get('text'),str):
                t=clean(sv['text'],n//2)
                if t and t.lower()!='na': parts.append(f"{k.strip()}: {t}")
        return '\n'.join(parts) if parts else None
    return None
SPEC={
 'overview':[('Introduction','Background',2200),('Government','Country name',600),('Government','Capital',500),('Government','Independence',300),('Government','National holiday',300),('Government','National symbol(s)',300),('Government','National color(s)',200),('Government','National anthem(s)',500),('Government','Flag',600),('Government','National heritage',700)],
 'geography':[('Geography','Location',300),('Geography','Area',300),('Geography','Area - comparative',200),('Geography','Land boundaries',500),('Geography','Coastline',100),('Geography','Climate',400),('Geography','Terrain',400),('Geography','Elevation',300),('Geography','Natural resources',500),('Geography','Major rivers (by length in km)',500),('Geography','Major lakes (area sq km)',300),('Geography','Natural hazards',600),('Environment','Environmental issues',600),('Geography','Geography - note',700)],
 'people':[('People and Society','Population',300),('People and Society','Population growth rate',120),('People and Society','Median age',200),('People and Society','Age structure',400),('People and Society','Ethnic groups',500),('People and Society','Languages',600),('People and Society','Religions',500),('People and Society','Urbanization',300),('People and Society','Major urban areas - population',500),('People and Society','Sex ratio',300),('People and Society','Literacy',300),('People and Society','Life expectancy at birth',300),('People and Society','Infant mortality rate',300),('People and Society','Total fertility rate',120),('People and Society','Physician density',120),('People and Society','Hospital bed density',120),('People and Society','Health expenditure',300),('People and Society','Education expenditure',300),('People and Society','School life expectancy (primary to tertiary education)',300)],
 'government':[('Government','Government type',200),('Government','Executive branch',2200),('Government','Legislative branch',300),('Government','Legislative branch - lower chamber',1400),('Government','Legislative branch - upper chamber',1000),('Government','Judicial branch',800),('Government','Political parties',900),('Government','Administrative divisions',1200),('Government','Constitution',600),('Government','Legal system',400),('Government','Suffrage',200)],
 'economy':[('Economy','Economic overview',900),('Economy','Real GDP (purchasing power parity)',300),('Economy','Real GDP growth rate',300),('Economy','Real GDP per capita',300),('Economy','GDP (official exchange rate)',200),('Economy','Inflation rate (consumer prices)',300),('Economy','GDP - composition, by sector of origin',300),('Economy','Industries',500),('Economy','Agricultural products',400),('Economy','Unemployment rate',300),('Economy','Gini Index coefficient - distribution of family income',200),('Economy','Exports',300),('Economy','Exports - partners',300),('Economy','Exports - commodities',300),('Economy','Imports',300),('Economy','Imports - partners',300),('Economy','Imports - commodities',300),('Economy','Public debt',300),('Economy','Remittances',300),('Economy','Exchange rates',300)],
 'foreign':[('Government','International organization participation',1400),('Military and Security','Military and security forces',800),('Military and Security','Military expenditures',400),('Military and Security','Military and security service personnel strengths',500),('Military and Security','Military equipment inventories and acquisitions',500),('Military and Security','Military deployments',500),('Military and Security','Military - note',900),('Transnational Issues','Refugees and internally displaced persons',500),('Terrorism','Terrorist group(s)',500)],
 'infra':[('Energy','Electricity access',300),('Energy','Electricity generation sources',500),('Energy','Nuclear energy',400),('Communications','Internet users',300),('Communications','Telephones - mobile cellular',300),('Communications','Broadband - fixed subscriptions',300),('Communications','Broadcast media',600),('Transportation','Airports',200),('Transportation','Railways',300),('Transportation','Ports',500),('Transportation','Merchant marine',300),('Space','Space program overview',700)],
}
out={}; unmatched=[]
for f in glob.glob(FB+'/*/*.json'):
    if '/meta/' in f or '/oceans/' in f or '/world/' in f: continue
    d=json.load(open(f))
    try: tld=d['Communications']['Internet country code']['text'].strip().lower().split()[0]
    except: tld=None
    try: nm=html.unescape(d['Government']['Country name']['conventional short form']['text']).lower()
    except: nm=None
    k=byname.get(nm) if nm else None
    if not k: k=bytld.get(tld) if tld and tld!='none' else None
    if not k: unmatched.append((f.split('/')[-1],nm,tld)); continue
    rec={}
    for tab,fields in SPEC.items():
        rows=[]
        for sec,fld,n in fields:
            v=d.get(sec,{}).get(fld)
            t=txt(v,n) if v else None
            if t and t.upper()!='NA': rows.append([fld,t])
        if rows: rec[tab]=rows
    def raw(sec,fld,sub=None):
        v=d.get(sec,{}).get(fld)
        if v and sub: v=v.get(sub)
        return html.unescape(v['text']) if isinstance(v,dict) and isinstance(v.get('text'),str) else None
    rec['_m']={'capll':raw('Government','Capital','geographic coordinates'),'gdpoff':raw('Economy','GDP (official exchange rate)'),'gini':json.dumps(d.get('Economy',{}).get('Gini Index coefficient - distribution of family income',{}))}
    if k in out and len(json.dumps(out[k]))>len(json.dumps(rec)): continue
    out[k]=rec
json.dump(out,open('/home/claude/build/factbook.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out),'matched; size',os.path.getsize('/home/claude/build/factbook.json'))
print('unmatched',unmatched)
