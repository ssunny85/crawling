const axios = require('axios');
const cheerio = require('cheerio');
const Iconv = require('iconv').Iconv;
const iconv = new Iconv('EUC-KR', 'UTF-8');
const Slack = require('slack-node');
const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = 'http://m.ppomppu.co.kr';
const KEYWORD = [
  '신세계',
  '왕교자',
  '비비고',
];

const getHtml = async () => {
  try {
    return await axios({
      method: 'GET',
      url: `${BASE_URL}/new/bbs_list.php?id=ppomppu`,
      responseType: 'arraybuffer',
    });
  } catch (error) {
    console.error('getHtml: ', error);
  }
};

const slack = new Slack();
slack.setWebhook(process.env.WEBHOOK_URI);

const send = async (results) => {
  if (!results.length) return;
  slack.webhook({
    text: '뽐뿌 핫딜',
    attachments: results.map((result) => ({
      pretext: `${result.title} pretext: <${result.url}>`,
    }))
  }, function(error) {
    console.log('send error: ', error);
  });
};

getHtml()
  .then((html) => {
    const htmlDoc = iconv.convert(html.data).toString();
    const $ = cheerio.load(htmlDoc);
    const $bodyList = $('.bbs > .bbsList_new:first').children('li');
    let list = [];
    $bodyList.each(function(i, elem) {
      list[i] = {
        title: $(this).find('.title .cont').text(),
        url: $(this).find('> a').attr('href'),
      };
    });
    return list.filter((n) => n.title);
  })
  .then((res) => {
    const results = res
      .filter((item) => KEYWORD.some((word) => item.title.includes(word)))
      .map((item) => ({
          ...item,
          url: `${BASE_URL}/new/${item.url}`,
        }));
    console.log('results: ', results);
    send(results).then((res) => {
      console.log('send res: ', res);
    });
  });


