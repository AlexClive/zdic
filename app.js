const Koa = require('koa');
const superagent = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');
const app = new Koa();

let getHotNews = function (res) {
    let hotNews = [];
    let $ = cheerio.load(res.text);
    let newStrokes = '';
    // 找到目标数据所在的页面元素，获取数据
    $('div.browse_wrapper .res_c_center .res_c_center_content .nr-box table tbody tr').each((index, ele) => {
        if ($(ele).children('td').children('div.bsyx').text() !== '') {
            newStrokes = $(ele).children('td').children('div.bsyx').text()
        }
        if ($(ele).children('td').children('div.bsul').children('ul').children('li').children('a').text() !== '') {
            let news = {
                strokes: newStrokes,
                title: $(ele).children('td').children('div.bsul').children('ul').children('li').children('a').text()
            };
            hotNews.push(news)
        }
    });
    return hotNews;
};

let getWriting = function (res) {
    let hotNews = [];
    let $ = cheerio.load(res.text);
    let newStrokes = '';
    // 找到目标数据所在的页面元素，获取数据
    $('li').each((index, ele) => {
        if ($(ele).text() !== '') {
            newStrokes = $(ele).text();
        } else {
            newStrokes = $(ele).children('a').children('img').attr('src');
        }
        hotNews.push(newStrokes)
    });
    return hotNews;
};

let writeToFile = function (file) {
    fs.writeFile(file, JSON.stringify(hotNews), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log('数据成功写入');
        writing();
    })
};
let writeAddFile = function (file) {
    fs.appendFile(file, JSON.stringify(hotNews + ','), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log('数据成功写入');
    })
};
let hotNews = [];
let proxy = function (api, file) {
    superagent.get(api).end((err, res) => {
        if (err) {
            // 如果访问失败或者出错，会这行这里
            console.log(`数据抓取失败 - ${err}`)
        } else {
            // 访问成功，请求http://news.baidu.com/页面所返回的数据会包含在res
            // 抓取热点新闻数据
            if (file === 'radical.json') {
                hotNews = getHotNews(res);
                fs.stat(file, (err, stats) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    if (stats.isFile()) {
                        writeToFile(file);
                    }
                })
            } else {
                hotNews = getWriting(res);
                fs.stat(file, (err, stats) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    if (stats.isFile()) {
                        writeAddFile(file);
                    }
                })
            }

        }
    });
};

let writing = function () {
    fs.readFile('radical.json', (err, data) => {
        if (err) {
            return console.error(err);
        }
        let radical = JSON.parse(data.toString());
        let map = {};
        for (let i = 0; i < radical.length; i++) {
            map['list' + i] = radical[i].title.split('');
        }
        for (let key in map) {
            for (let i = 0; i < map[key].length; i++) {
                console.log(map[key][i]);
                let api = 'https://www.zdic.net/zd/bs/bs/?bs=' + encodeURI(map[key][i]);
                proxy(api, 'writing.json');
            }
        }
    });
};

//获取用户IP
const getClientIp = function (req) {
    /*
    *   （1）req.headers['x-forwarded-for']判断是否有反向代理IP(头信息：x-forwarded-for)，

        （2）req.connection.remoteAddress在判断connection的远程IP，

        （3）req.socket.remoteAddress代理的socket的IP。

        （4）req.connection.socket.remoteAddress后端的socket的IP。
    * */
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};

// response
app.use(ctx => {
    ctx.body = 'Hello Koa';
    console.log(getClientIp(ctx.req));
});

app.listen(3000, () => {
    let host = 'localhost';
    let port = '3000';
    console.log('Your App is running at http://%s:%s', host, port);
    //proxy('https://www.zdic.net/zd/bs/', 'radical.json');
});
