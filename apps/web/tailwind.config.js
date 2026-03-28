/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Echo Purple 스케일
        purple: {
          950: '#1C1850',
          900: '#2A2660',
          800: '#3C3489',
          700: '#534AB7',
          500: '#7F77DD',
          400: '#A89EF5', // Dark CTA
          300: '#AFA9EC',
          100: '#EEEDFE',
          50:  '#F4F2FF',
        },
        // 시맨틱
        error: '#E24B4A',
        success: '#1D9E75',
        gold: '#FFD93D',
        kakao: '#FEE500',
        // 아바타
        'ava-purple': '#7F77DD',
        'ava-green':  '#1D9E75',
        'ava-yellow': '#F0A030',
        'ava-pink':   '#D4537E',
      },
      fontFamily: {
        sans: [
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'Noto Sans KR',
          'sans-serif',
        ],
        mono: ['Arial', 'sans-serif'],
      },
      fontSize: {
        'display': ['22px', { fontWeight: '500', lineHeight: '1.3' }],
        'h1': ['15px', { fontWeight: '500', lineHeight: '1.4' }],
        'h2': ['13px', { fontWeight: '500', lineHeight: '1.4' }],
        'body1': ['11px', { fontWeight: '500', lineHeight: '1.5' }],
        'body2': ['11px', { fontWeight: '400', lineHeight: '1.5' }],
        'caption': ['9px', { fontWeight: '500', letterSpacing: '0.04em', lineHeight: '1.4' }],
        'micro': ['8px', { fontWeight: '400', lineHeight: '1.3' }],
      },
      borderRadius: {
        'badge':  '4px',
        'thumb':  '6px',
        'drop':   '8px',
        'btn':    '10px',
        'card':   '12px',
        'btn-lg': '14px',
        'sheet':  '20px',
      },
      spacing: {
        '4.5': '18px',
      },
    },
  },
  plugins: [],
}
