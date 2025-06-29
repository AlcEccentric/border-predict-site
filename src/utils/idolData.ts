export interface IdolInfo {
  id: number;
  name: string;
  shortName: string;
  color: string;
}

// Parse idol data from ref.txt format
const parseIdolData = (): Map<number, IdolInfo> => {
  const idolData = new Map<number, IdolInfo>();
  
  // Data from ref.txt
  const idolList = [
    { name: '天海春香', id: 1, shortName: 'har', color: '#e22b30' },
    { name: '如月千早', id: 2, shortName: 'chi', color: '#2743d2' },
    { name: '星井美希', id: 3, shortName: 'mik', color: '#b4e04b' },
    { name: '萩原雪歩', id: 4, shortName: 'yuk', color: '#d3dde9' },
    { name: '高槻やよい', id: 5, shortName: 'yay', color: '#f39939' },
    { name: '菊地真', id: 6, shortName: 'mak', color: '#515558' },
    { name: '水瀬伊織', id: 7, shortName: 'ior', color: '#fd99e1' },
    { name: '四条貴音', id: 8, shortName: 'tak', color: '#a6126a' },
    { name: '秋月律子', id: 9, shortName: 'rit', color: '#01a860' },
    { name: '三浦あずさ', id: 10, shortName: 'azu', color: '#9238be' },
    { name: '双海亜美', id: 11, shortName: 'ami', color: '#ffe43f' },
    { name: '双海真美', id: 12, shortName: 'mam', color: '#ffe43f' },
    { name: '我那覇響', id: 13, shortName: 'hib', color: '#01adb9' },
    { name: '春日未来', id: 14, shortName: 'mir', color: '#ea5b76' },
    { name: '最上静香', id: 15, shortName: 'siz', color: '#6495cf' },
    { name: '伊吹翼', id: 16, shortName: 'tsu', color: '#fed552' },
    { name: '田中琴葉', id: 17, shortName: 'kth', color: '#92cfbb' },
    { name: '島原エレナ', id: 18, shortName: 'ele', color: '#9bce92' },
    { name: '佐竹美奈子', id: 19, shortName: 'min', color: '#58a6dc' },
    { name: '所恵美', id: 20, shortName: 'meg', color: '#454341' },
    { name: '徳川まつり', id: 21, shortName: 'mat', color: '#5abfb7' },
    { name: '箱崎星梨花', id: 22, shortName: 'ser', color: '#ed90ba' },
    { name: '野々原茜', id: 23, shortName: 'aka', color: '#eb613f' },
    { name: '望月杏奈', id: 24, shortName: 'ann', color: '#7e6ca8' },
    { name: 'ロコ', id: 25, shortName: 'roc', color: '#fff03c' },
    { name: '七尾百合子', id: 26, shortName: 'yur', color: '#c7b83c' },
    { name: '高山紗代子', id: 27, shortName: 'say', color: '#7f6575' },
    { name: '松田亜利沙', id: 28, shortName: 'ari', color: '#b54461' },
    { name: '高坂海美', id: 29, shortName: 'umi', color: '#e9739b' },
    { name: '中谷育', id: 30, shortName: 'iku', color: '#f7e78e' },
    { name: '天空橋朋花', id: 31, shortName: 'tom', color: '#bee3e3' },
    { name: 'エミリースチュアート', id: 32, shortName: 'emi', color: '#554171' },
    { name: '北沢志保', id: 33, shortName: 'sih', color: '#afa690' },
    { name: '舞浜歩', id: 34, shortName: 'ayu', color: '#e25a9b' },
    { name: '木下ひなた', id: 35, shortName: 'hin', color: '#d1342c' },
    { name: '矢吹可奈', id: 36, shortName: 'kan', color: '#f5ad3b' },
    { name: '横山奈緒', id: 37, shortName: 'nao', color: '#5abfb7' },
    { name: '二階堂千鶴', id: 38, shortName: 'chz', color: '#f19557' },
    { name: '馬場このみ', id: 39, shortName: 'kon', color: '#f1becb' },
    { name: '大神環', id: 40, shortName: 'tam', color: '#ee762e' },
    { name: '豊川風花', id: 41, shortName: 'fuk', color: '#7278a8' },
    { name: '宮尾美也', id: 42, shortName: 'miy', color: '#d7a96b' },
    { name: '福田のり子', id: 43, shortName: 'nor', color: '#eceb70' },
    { name: '真壁瑞希', id: 44, shortName: 'miz', color: '#99b7dc' },
    { name: '篠宮可憐', id: 45, shortName: 'kar', color: '#b63b40' },
    { name: '百瀬莉緒', id: 46, shortName: 'rio', color: '#f19591' },
    { name: '永吉昴', id: 47, shortName: 'sub', color: '#aeb49c' },
    { name: '北上麗花', id: 48, shortName: 'rei', color: '#6bb6b0' },
    { name: '周防桃子', id: 49, shortName: 'mom', color: '#efb864' },
    { name: 'ジュリア', id: 50, shortName: 'jul', color: '#d7385f' },
    { name: '白石紬', id: 51, shortName: 'tmg', color: '#ebe1ff' },
    { name: '桜守歌織', id: 52, shortName: 'kao', color: '#274079' },
  ];

  idolList.forEach(idol => {
    idolData.set(idol.id, idol);
  });

  return idolData;
};

export const IDOL_DATA = parseIdolData();

export const getIdolInfo = (id: number): IdolInfo | undefined => {
  return IDOL_DATA.get(id);
};

export const getIdolName = (id: number): string => {
  const info = getIdolInfo(id);
  return info ? info.name : `アイドル ${id}`;
};

export const getIdolColor = (id: number): string => {
  const info = getIdolInfo(id);
  return info ? info.color : '#8884d8';
};

export const getIdolShortName = (id: number): string => {
  const info = getIdolInfo(id);
  return info ? info.shortName : `idol${id}`;
};
