export interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
}

export const MOCK_WORDS: Word[] = [
  { id: '1', word: '辩论', pinyin: 'bian lun', meaning: '见解不同的人彼此阐述理由，辩驳争论。' },
  { id: '2', word: '分辨', pinyin: 'fen bian', meaning: '辨别。' },
  { id: '3', word: '智慧', pinyin: 'zhi hui', meaning: '辨析判断、发明创造的能力。' },
  { id: '4', word: '逆袭', pinyin: 'ni xi', meaning: '防御时反击入侵之敌；也指弱者反弹战胜强者。' },
  { id: '5', word: '堡垒', pinyin: 'bao lei', meaning: '用于防守的坚固建筑物。' },
];
