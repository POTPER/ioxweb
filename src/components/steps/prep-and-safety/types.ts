import React from 'react';

export interface Equipment {
  id: string;
  name: string;
  desc: string;
  image: string;
  layerImage?: string;
  isCorrect: boolean;
  details?: Record<string, string>;
}

export interface Weather {
  id: string;
  name: string;
  desc: string;
  image: string;
  bgImage: string;
  isCorrect: boolean;
  details: Record<string, string>;
}

export const weatherOptions: Weather[] = [
  {
    id: 'A',
    name: '多云微风',
    desc: '适宜测量。天气多云，气温18°C，风力2级。',
    image: 'https://picsum.photos/seed/weather-a/200/150',
    bgImage: 'https://picsum.photos/seed/bg-a/800/600?blur=2',
    isCorrect: true,
    details: { '天气': '多云', '气温': '18°C', '湿度': '65%', '风力': '2级（东南风，约3m/s）', '降水': '无', '24h预报': '午后转阴，傍晚有小雨' }
  },
  {
    id: 'B',
    name: '暴雨强风',
    desc: '应暂停。持续大雨，风力5级。',
    image: 'https://picsum.photos/seed/weather-b/200/150',
    bgImage: 'https://picsum.photos/seed/bg-b/800/600?grayscale',
    isCorrect: false,
    details: { '天气': '暴雨', '气温': '15°C', '湿度': '95%', '风力': '5级（约10m/s）', '降水': '持续大雨', '24h预报': '午后转中雨' }
  },
  {
    id: 'C',
    name: '6级大风',
    desc: '应暂停。风力6级，地面扬尘。',
    image: 'https://picsum.photos/seed/weather-c/200/150',
    bgImage: 'https://picsum.photos/seed/bg-c/800/600?sepia',
    isCorrect: false,
    details: { '天气': '晴', '气温': '22°C', '湿度': '40%', '风力': '6级（约13m/s）', '降水': '无', '24h预报': '午后风力加大至7级' }
  },
  {
    id: 'D',
    name: '大雾低能见',
    desc: '安全风险。浓雾弥漫，能见度极低。',
    image: 'https://picsum.photos/seed/weather-d/200/150',
    bgImage: 'https://picsum.photos/seed/bg-d/800/600?blur=8',
    isCorrect: false,
    details: { '天气': '大雾', '气温': '12°C', '湿度': '98%', '风力': '1级（约1m/s）', '降水': '无', '24h预报': '上午雾散转多云' }
  }
];

export const safetyOptions: Equipment[] = [
  {
    id: '1',
    name: '安全帽',
    desc: '建筑施工现场头部防护装备，防止物体打击和坠落伤害。',
    image: 'https://picsum.photos/seed/safety-1/200/150',
    layerImage: 'https://img.icons8.com/color/200/hard-hat.png',
    isCorrect: true,
    details: { '标准': 'GB 2811-2019' }
  },
  {
    id: '2',
    name: '反光背心',
    desc: '高可视性警示服，使穿着者在施工现场更易被识别。',
    image: 'https://picsum.photos/seed/safety-2/200/150',
    layerImage: 'https://img.icons8.com/color/200/safety-vest.png',
    isCorrect: true,
    details: { '标准': 'GB 20653-2006' }
  },
  {
    id: '3',
    name: '防毒面具',
    desc: '呼吸防护装备，用于过滤有毒有害气体和粉尘。',
    image: 'https://picsum.photos/seed/safety-3/200/150',
    layerImage: 'https://img.icons8.com/color/200/gas-mask.png',
    isCorrect: false,
    details: { '标准': 'GB 2890-2009' }
  },
  {
    id: '4',
    name: '护目镜',
    desc: '眼部防护装备，防止飞溅物、粉尘对眼睛造成伤害。',
    image: 'https://picsum.photos/seed/safety-4/200/150',
    layerImage: 'https://img.icons8.com/color/200/safety-glasses.png',
    isCorrect: false,
    details: { '标准': 'GB 14866-2006' }
  }
];

export const instrumentOptions: Equipment[] = [
  {
    id: 'A',
    name: '滑动式测斜仪',
    desc: '利用重力加速度传感器测量管内各深度点倾斜角，逐点推算水平位移累积量。',
    image: 'https://picsum.photos/seed/inst-a/200/150',
    layerImage: 'https://img.icons8.com/color/200/measuring-tape.png',
    isCorrect: true,
    details: { '类型': '手持测量仪器', '精度': '±0.02mm/500mm', '量程': '0°~53°' }
  },
  {
    id: 'B',
    name: '固定式测斜仪',
    desc: '多个传感器固定安装在测斜管内不同深度，通过数据线实时传输各点倾斜角变化。',
    image: 'https://picsum.photos/seed/inst-b/200/150',
    layerImage: 'https://img.icons8.com/color/200/sensor.png',
    isCorrect: false,
    details: { '类型': '固定安装传感器', '精度': '±0.01mm/500mm', '量程': '0°~30°' }
  },
  {
    id: 'C',
    name: '静力水准仪',
    desc: '基于连通器原理，通过液面高度差测量各监测点的竖向沉降量。',
    image: 'https://picsum.photos/seed/inst-c/200/150',
    layerImage: 'https://img.icons8.com/color/200/level.png',
    isCorrect: false,
    details: { '类型': '固定安装传感器', '精度': '±0.05mm', '量程': '±50mm' }
  },
  {
    id: 'D',
    name: '收敛计',
    desc: '测量两点之间的距离变化，获取断面收敛变形量。',
    image: 'https://picsum.photos/seed/inst-d/200/150',
    layerImage: 'https://img.icons8.com/color/200/ruler.png',
    isCorrect: false,
    details: { '类型': '手持测量仪器', '精度': '±0.1mm', '量程': '0~30m' }
  }
];
