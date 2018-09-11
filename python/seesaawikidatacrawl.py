import json, requests, os, time, re

closeunitindexpage = r'http://seesaawiki.jp/aigis/d/class_%b6%e1%c0%dc%b7%bf_index'
farunitindexpage = r'http://seesaawiki.jp/aigis/d/class_%b1%f3%b5%f7%ce%a5%b7%bf_index'
closeunitstatuspage = r'http://seesaawiki.jp/aigis/d/%b6%e1%c0%dc%b7%bf1'
farunitstatuspage = r'http://seesaawiki.jp/aigis/d/%b1%f3%b5%f7%ce%a5%b7%bf1'

pagetimetext = r'pagetime.txt'
pagetimelist = {}

timebetweentwoget = 3
lastgettime = 100.0
def gethtmldata(htmllink, force = False):
    if len(pagetimelist) == 0:
        with open('pagetime.txt', 'r') as f:
            for i in f.readlines():
                if len(i) < 10:
                    continue
                i = i.strip().split('|')
                pagetimelist[i[0]] = i[1]
    heads = {'If-Modified-Since': 'Fri, 01 Jan 1971 00:00:01 GMT'}
    if force != True and htmllink in pagetimelist.keys():
        heads['If-Modified-Since'] = pagetimelist[htmllink]
    restext = ''
    while True:
        try:
            global lastgettime
            timedelta = lastgettime + timebetweentwoget - time.time()
            if timedelta > 0:
                #print('sleep', str(timedelta), 'seconds')
                time.sleep(timedelta)
            lastgettime = time.time()
            html = requests.get(htmllink, headers = heads, timeout = 10)
            #print(html)
            if html.status_code == 304:
                print('page', htmllink, 'get status code 304')
                filename = re.search(r'[^/?=]*$', htmllink).group(0)
                with open('htmls/' + filename, 'r') as f:
                    restext = f.read()
                break
            elif html.status_code == 200:
                filename = re.search(r'[^/?=]*$', htmllink).group(0)
                with open('htmls/' + filename, 'w') as f:
                    f.write(html.text)
                restext = html.text
                rescontent = html.content
                #print(html.headers)
                if not re.search(r'\.([pP][nN][gG]|[jJ][pP][eE]?[gG])$', htmllink):
                    pagetimelist[htmllink] = html.headers['Last-Modified'] if 'Last-Modified' in html.headers.keys() else 'Fri, 01 Jan 1971 00:00:01 GMT'
                break
            print('get page error: ', htmllink, '| error code:', html.status_code)
        except Exception as e:
            print(e)
    return removebr(restext), rescontent

imageurls = set([])
def addimageurl(url):
    imageurls.add(url)

def getimages():
    for i in imageurls:
        print(i)
        m = re.search(r'https?://image(\d+).seesaawiki.jp/.*?/([^/]*)$', i)
        if m:
            filename = 'images/' + m.group(1) + m.group(2)
            if not os.path.exists(filename):
                print('image', i, 'not exist, start downloading')
                textres, contentres = gethtmldata(i)
                print('image download complete, size: ', str(len(contentres)))
                with open(filename, 'wb') as f:
                    f.write(contentres)

def savepagetimelist():
    with open('pagetime.txt', 'w') as f:
        for key in pagetimelist.keys():
            f.write(key + '|' + pagetimelist[key] + '\n')

def removebr(page):
    return re.sub(r'<br\s?/?>|~~', '', page)

def getindexstatuspage(unitindexpage, unitstatuspage):

    oneclassrow = r'<td colspan="7".*?</tr>.*?<tr>.*?</tr>'
    onerowregex = r'<td colspan="7".*?><a href=.*?><b>(.*?)</b></a></td></tr><tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>'
    oneunitregex = r'<a href="([^"]*?)"[^<>]*?>(.*?)</a>'

    htmlpage, htmlcontent = gethtmldata(unitindexpage)
    m = re.findall(oneclassrow, htmlpage)
    #print('\n----------\n'.join(m))
    res = {}
    #onelineregex = re.compile(r'<td colspan="7".*?><a href=.*?><b>(.*?)<\/b><\/a><\/td><\/tr><tr><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><\/tr>')
    onerowregexcompile = re.compile(onerowregex)
    for i in m:
        m = onerowregexcompile.match(i)
        if m:
            nowclassname = m.group(1)
            #print(m.groups())
            for num in range(2, 9):
                allunit = re.findall(oneunitregex, m.group(num))
                for oneunit in allunit:
                    tmap = {}
                    tmap['class'] = nowclassname
                    tmap['unitpage'] = oneunit[0]
                    tmap['rare'] = num - 1
                    tmap['statuspage'] = ''
                    res[oneunit[1]] = tmap
    htmlpage, htmlcontent = gethtmldata(unitstatuspage)
    m = re.findall(oneclassrow, htmlpage)
    for i in m:
        m = onerowregexcompile.match(i)
        if m:
            for num in range(2, 9):
                allstatus = re.findall(oneunitregex, m.group(num))
                for onestatus in allstatus:
                    unitname = onestatus[1][7:]
                    if unitname in res.keys():
                        res[unitname]['statuspage'] = onestatus[0]
    return res


def getunitpage(unitmap):
    
    unitstatuslinkregex = r'<table[^>]*?>(?:(?!table).)*?名前.*?攻撃.*?<a href="([^"]*?)"[^<>]*?>編集</a>.*?</table>'
    #unitclasslistregex = r'<table[^>]*?><tbody><tr>((?:(?!tr).)*?)</tr>(?:(?!table).)*?アイコン(?:(?!table).)*?ドット.*?</table>'
    unitclassiconregex = r'<table[^>]*?><tbody><tr>((?:(?!tr).)*?)</tr><tr>((?:(?!tr).)*?アイコン(?:(?!tr).)*?)</tr>(?:(?!table).)*?ドット.*?</table>'
    oneunitclassregex = r'<th[^>]*?>([^<>]+?)</th>'
    oneuniticonregex = r'<td(?: colspan="(\d+?)")?[^>]*?>(?:<a[^>]*?>)?<img src="([^"]*?)"'

    htmlpage, htmlcontent = gethtmldata(unitmap['unitpage'])
    m = re.search(unitstatuslinkregex, htmlpage)
    if m:
        #print('statusfind', m.group(1), '\n-------')
        unitmap['statuspage'] = m.group(1)
    m =re.search(unitclassiconregex, htmlpage)
    classlist = []
    if m:
        #print('classnamefind', m.group(1), '\n-------')
        res = re.findall(oneunitclassregex, m.group(1))
        for i in res:
            classlist.append([i])
        nowneed = 0
        #print('uniticonfind', m.group(2), '\n-------')
        res = re.findall(oneuniticonregex, m.group(2))
        for i in res:
            step = 1
            addimageurl(i[1])
            if i[0] != '':
                step = int(i[0])
            for j in range(step):
                if nowneed >= len(classlist):
                    break
                classlist[nowneed].append(i[1])
                nowneed += 1
    unitmap['classwithicon'] = classlist

    unitmap['status'] = getstatuspage(unitmap['statuspage'])

    return unitmap


def getstatuspage(statuspage):
    
    statusdataregex = r'<textarea id="content" name="content" row="5" cols="100">([\s\S]*?)</textarea>'
    onerowregex = r"\|[^|\n]*?\|[^|\n]*?\|(?:\[\[)?([^^&\n]+)(?:[^|\n]*?\]\])?\|(?:[^|\n]*?\|[^|\n]*?\|[^|\n]*?\|[^|\n]*?\|[^|\n]?\|\|\|\|[^|\n]*?\|[^|\n]*?\|[^|\n]*?\|[^|\n]*?\|[\s\S]*?\|[^|\n]*?\|[^|\n]*?\|\^\|)?[^|\n]*?\|[^|\n]*?\|[^|\n]*?\|[^|\n]*?\|[^|\n]*?\|(?:center:)?(?:'')?(\d+?)(?:'')?\|(?:center:)?(?:'')?(\d+?)(?:'')?\|(?:center:)?(?:'')?(\d+?)(?:'')?\|"

    #print(statuspage)
    if statuspage == '':
        return {}
    htmlpage, htmlcontent = gethtmldata(statuspage)
    m = re.search(statusdataregex, htmlpage)
    res = {}
    if m:
        #print(m.group(1))
        content = m.group(1)
        statusdata = re.findall(onerowregex, content)
        for i in statusdata:
            res[i[0]] = [int(i[1]), int(i[2]), int(i[3])]
    return res


if __name__ == '__main__':
    closeunitlist = getindexstatuspage(closeunitindexpage, closeunitstatuspage)
    farunitlist = getindexstatuspage(farunitindexpage, farunitstatuspage)
    allunitlist = {}
    for key in closeunitlist.keys():
        closeunitlist[key]['position'] = 'close'
        allunitlist[key] = closeunitlist[key]
    for key in farunitlist.keys():
        farunitlist[key]['position'] = 'far'
        allunitlist[key] = farunitlist[key]
    

    test = {}
    for (key, value) in allunitlist.items():
        test[key] = value
    #    if len(test) > 0:
    #        break
    #testunitname = '聖鈴の大盾ベルニス'
    #testunitname = '神殿書記官レーヴ'
    #testunitname = '吸血鬼狩人フーリ'
    testunitname = '九尾狐カヨウ'
    #testunitname = 'ちびナナリー'
    #testunitname = '水着の政務官アンナ'
    #testunitname = '魔物使いスイル'
    #test['姫侍シズカ'] = closeunitlist['姫侍シズカ']
    #test['妖魔の侍女リーナ'] = closeunitlist['妖魔の侍女リーナ']
    #test['仙猿ファー'] = closeunitlist['仙猿ファー']
    #test['リリア'] = closeunitlist['リリア']
    test[testunitname] = allunitlist[testunitname]
    #print(test)
    count = 0
    for key in test.keys():
        #print(key, test[key])
        test[key] = getunitpage(test[key])
        count += 1
        print(key, str(count) + '/' + str(len(test.keys())))
    with open('unitdata.json', 'w') as f:
        jsonstr = json.dumps(test, sort_keys = True, indent = 4, ensure_ascii = False)
        #print(jsonstr)
        f.write(jsonstr)
    getimages()
    savepagetimelist()

    #print(pagetimelist)


