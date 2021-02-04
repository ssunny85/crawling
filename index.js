const axios = require('axios');
const cheerio = require('cheerio');
const Iconv = require('iconv').Iconv;
const iconv = new Iconv('EUC-KR', 'UTF-8');

const BASE_URL = 'http://m.ppomppu.co.kr';
const KEYWORD = [
  '신세계',
  '왕교자',
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
