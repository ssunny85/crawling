const axios = require('axios');
const cheerio = require('cheerio');
const Iconv = require('iconv').Iconv;
const iconv = new Iconv('EUC-KR', 'UTF-8');
const Slack = require('slack-node');
const webhookUri = 'Webhook URL';

const BASE_URL = 'http://m.ppomppu.co.kr';
// const KEYWORD = [
//   '신세계',
//   '왕교자',
// ];
const KEYWORD = [
  '나이키',
  '샤오미',
];
const getHtml = async () => {
  try {
    return await axios({
      method: 'GET',
      url: `${BASE_URL}/new/bbs_list.php?id=ppomppu`,
      responseType: 'arraybuffer',
    });
  } catch (error) {
    console.error(error);
  }
};


const slack = new Slack();
slack.setWebhook(webhookUri);

const send = async (message) => {
  slack.webhook({
    text: "인터넷 검색 포털 사이트",
    attachments:[
      {
        fallback: "링크주소: <https://www.google.com|구글>",
        pretext: "링크주소: <https://www.google.com|구글>",
        color: "#00FFFF",
        fields: [
          {
            title: "알림",
            value: "해당링크를 클릭하여 검색해 보세요.",
            short: false
          }
        ]
      }
    ]
  }, function(err, response){
    console.log('err: ', err);
    console.log('response: ', response);
  });
};

getHtml()
  .then((html) => {
    const htmlDoc = iconv.convert(html.data).toString();
    const $ = cheerio.load(htmlDoc);
    const $bodyList = $('.bbsList_new').children('li');
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
    console.log('res: ', res);
    const results = res
      .filter((item) => KEYWORD.some((word) => item.title.includes(word)))
      .map((item) => ({
          ...item,
          url: `${BASE_URL}${item.url}`,
        }));
    if (!results.length) {
      console.log('결과 없음');
      return;
    }
    return results;
  });


