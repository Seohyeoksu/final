import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRandomGradient() {
  const gradients = [
    'radial-gradient(circle, #60FF80 0%, #40FF60 50%, #20FF40 100%)', // 선명한 민트 그린
    'radial-gradient(circle, #FF60FF 0%, #FF40FF 50%, #FF20FF 100%)', // 선명한 마젠타
    'radial-gradient(circle, #60D0FF 0%, #40C0FF 50%, #20B0FF 100%)', // 선명한 시안
    'radial-gradient(circle, #FFFF00 0%, #FFE600 50%, #FFCC00 100%)', // 선명한 옐로우
    'radial-gradient(circle, #FF80D0 0%, #FF60C0 50%, #FF40B0 100%)', // 선명한 핑크
    'radial-gradient(circle, #FFB060 0%, #FF9040 50%, #FF7020 100%)', // 선명한 오렌지
    'radial-gradient(circle, #A0FF60 0%, #80FF40 50%, #60FF20 100%)', // 선명한 라임
    'radial-gradient(circle, #80C0FF 0%, #60B0FF 50%, #40A0FF 100%)', // 선명한 블루
    'radial-gradient(circle, #D080FF 0%, #C060FF 50%, #B040FF 100%)', // 선명한 보라
    'radial-gradient(circle, #FFD000 0%, #FFC000 50%, #FFB000 100%)', // 선명한 골드
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}
