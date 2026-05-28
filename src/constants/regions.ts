export type SubRegion = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  level: number;
};

export type RegionInfo = {
  name: string;
  dot: string;
  lat: number;
  lng: number;
  level: number;
  subs: SubRegion[];
};

export const REGION_DATA: Record<string, RegionInfo> = {
  seoul: {
    name: "서울", dot: "#B6E4D2", lat: 37.5665, lng: 126.9780, level: 9,
    subs: [
      { id: "seoul-songpa",       name: "송파구",   lat: 37.5145, lng: 127.1059, level: 7 },
      { id: "seoul-mapo",         name: "마포구",   lat: 37.5665, lng: 126.9020, level: 7 },
      { id: "seoul-yeongdeungpo", name: "영등포구", lat: 37.5264, lng: 126.8963, level: 7 },
      { id: "seoul-gwangjin",     name: "광진구",   lat: 37.5385, lng: 127.0823, level: 7 },
      { id: "seoul-seocho",       name: "서초구",   lat: 37.4837, lng: 127.0325, level: 7 },
      { id: "seoul-gangnam",      name: "강남구",   lat: 37.5172, lng: 127.0473, level: 7 },
      { id: "seoul-yongsan",      name: "용산구",   lat: 37.5311, lng: 126.9810, level: 7 },
      { id: "seoul-seongdong",    name: "성동구",   lat: 37.5633, lng: 127.0369, level: 7 },
    ],
  },
  gyeonggi: {
    name: "경기", dot: "#B7DAF5", lat: 37.4138, lng: 127.5183, level: 10,
    subs: [
      { id: "gyeonggi-suwon",   name: "수원시", lat: 37.2636, lng: 127.0286, level: 8 },
      { id: "gyeonggi-seongnam", name: "성남시", lat: 37.4449, lng: 127.1388, level: 8 },
      { id: "gyeonggi-goyang",  name: "고양시", lat: 37.6584, lng: 126.8320, level: 8 },
      { id: "gyeonggi-yongin",  name: "용인시", lat: 37.2411, lng: 127.1776, level: 8 },
      { id: "gyeonggi-bucheon", name: "부천시", lat: 37.5035, lng: 126.7660, level: 8 },
      { id: "gyeonggi-anyang",  name: "안양시", lat: 37.3943, lng: 126.9568, level: 8 },
      { id: "gyeonggi-namyangju", name: "남양주시", lat: 37.6360, lng: 127.2165, level: 8 },
      { id: "gyeonggi-hwaseong", name: "화성시", lat: 37.1996, lng: 126.8312, level: 8 },
    ],
  },
  incheon: {
    name: "인천", dot: "#DCEEFB", lat: 37.4563, lng: 126.7052, level: 9,
    subs: [
      { id: "incheon-namdong",  name: "남동구", lat: 37.4469, lng: 126.7312, level: 7 },
      { id: "incheon-bupyeong", name: "부평구", lat: 37.5070, lng: 126.7218, level: 7 },
      { id: "incheon-yeonsu",   name: "연수구", lat: 37.4102, lng: 126.6783, level: 7 },
      { id: "incheon-seo",      name: "서구",   lat: 37.5456, lng: 126.6757, level: 7 },
    ],
  },
  busan: {
    name: "부산", dot: "#FFC9D0", lat: 35.1796, lng: 129.0756, level: 9,
    subs: [
      { id: "busan-haeundae",  name: "해운대구", lat: 35.1631, lng: 129.1635, level: 7 },
      { id: "busan-suyeong",   name: "수영구",   lat: 35.1453, lng: 129.1134, level: 7 },
      { id: "busan-yeonje",    name: "연제구",   lat: 35.1763, lng: 129.0806, level: 7 },
      { id: "busan-jung",      name: "중구",     lat: 35.1040, lng: 129.0321, level: 7 },
    ],
  },
  daegu: {
    name: "대구", dot: "#FFE38C", lat: 35.8714, lng: 128.6014, level: 9,
    subs: [
      { id: "daegu-jung",    name: "중구",   lat: 35.8686, lng: 128.6063, level: 7 },
      { id: "daegu-suseong", name: "수성구", lat: 35.8582, lng: 128.6305, level: 7 },
      { id: "daegu-dalseo",  name: "달서구", lat: 35.8295, lng: 128.5327, level: 7 },
      { id: "daegu-buk",     name: "북구",   lat: 35.8856, lng: 128.5826, level: 7 },
    ],
  },
  daejeon: {
    name: "대전", dot: "#D6C7F5", lat: 36.3504, lng: 127.3845, level: 9,
    subs: [
      { id: "daejeon-yuseong", name: "유성구", lat: 36.3623, lng: 127.3565, level: 7 },
      { id: "daejeon-seo",     name: "서구",   lat: 36.3557, lng: 127.3833, level: 7 },
      { id: "daejeon-jung",    name: "중구",   lat: 36.3254, lng: 127.4213, level: 7 },
    ],
  },
  gwangju: {
    name: "광주", dot: "#FFC8A8", lat: 35.1595, lng: 126.8526, level: 9,
    subs: [
      { id: "gwangju-buk",   name: "북구",   lat: 35.1741, lng: 126.9120, level: 7 },
      { id: "gwangju-seo",   name: "서구",   lat: 35.1522, lng: 126.8517, level: 7 },
      { id: "gwangju-gwangsan", name: "광산구", lat: 35.1397, lng: 126.7936, level: 7 },
    ],
  },
};
