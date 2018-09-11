from pyquery import PyQuery as pq
import requests

def crawl():
    encodingcode = 'EUC-JP'
    d = requests.get(url = 'http://wikiwiki.jp/aigiszuki/?%A5%E6%A5%CB%A5%C3%A5%C8%2F%A5%AF%A5%E9%A5%B9')
    print(d.status_code)
    d = d.content
    s = d#.decode(encodingcode)#.encode('EUC-JP')
    d = pq(s)
    close = d('.ctable .ie5')[0]
    far = d('.ctable .ie5')[1]
    closelist = []
    farlist = []
    columnnum = 1
    while True:
        res = d(close).find('tr td:nth-child(' + str(columnnum) + ')')
        if len(res) == 0:
            break
        for i in res:
            if len(d(i).text()) > 0:
                closelist.append(d(i).text().strip())
        columnnum += 1
    
    columnnum = 1
    while True:
        res = d(far).find('tr td:nth-child(' + str(columnnum) + ')')
        if len(res) == 0:
            break
        for i in res:
            if len(d(i).text()) > 0:
                farlist.append(d(i).text().strip())
        columnnum += 1

    return closelist, farlist

if __name__ == '__main__':
    close, far = crawl()
    print(len(close), len(far))
    print(close, far)
    with open('unitnames.txt', 'wb') as f:
        f.write('\n'.join(close).encode('utf-8'))
        f.write(b'\n')
        f.write('\n'.join(far).encode('utf-8'))
