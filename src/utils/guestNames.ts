// Guest name generator for anonymous users
const adjectives = [
  'Happy', 'Friendly', 'Cool', 'Smart', 'Kind', 'Brave', 'Swift', 'Bright',
  'Clever', 'Sunny', 'Lucky', 'Jolly', 'Merry', 'Noble', 'Proud', 'Quick',
  'Silent', 'Wise', 'Bold', 'Calm', 'Eager', 'Fair', 'Gentle', 'Honest'
];

const animals = [
  'Panda', 'Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion', 'Hawk',
  'Dolphin', 'Falcon', 'Owl', 'Penguin', 'Rabbit', 'Deer', 'Otter', 'Koala',
  'Leopard', 'Jaguar', 'Cheetah', 'Lynx', 'Raven', 'Phoenix', 'Dragon', 'Unicorn'
];

export function generateGuestName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 9999) + 1;
  
  return `${adjective}${animal}${number}`;
}

export function getOrCreateGuestName(): string {
  if (typeof window === 'undefined') {
    return generateGuestName();
  }

  let guestName = localStorage.getItem('guestUsername');
  
  if (!guestName) {
    guestName = generateGuestName();
    localStorage.setItem('guestUsername', guestName);
  }
  
  return guestName;
}

export function clearGuestName(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('guestUsername');
    localStorage.removeItem('guestUserId');
  }
}
