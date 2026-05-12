//Image change
const myFaceImage = document.querySelector(".myFaceImage");
const profileChangeRing = document.querySelector(".profileChangeRing");
const statusDot = document.querySelector(".status-dot");
const avatarRing = document.querySelector(".avatar-ring");
let profileItr = -1;
let startTime;
let hoverProfileInterval;
let imageArray = [
    "images/myface1.png" , 
    "images/myface2.png" ,
];
let ringColor = [
    "var(--green)",
    "var(--yellow)"
];
let percentageOfTime;
function changeProfilePicture(){
    profileItr = (profileItr + 1)%2;
    myFaceImage.src = imageArray[profileItr];
    profileChangeRing.style.setProperty("--progress",`${0}deg`); 
    statusDot.style.background = ringColor[profileItr];
    avatarRing.style.border = "2.5px solid " + ringColor[profileItr];
    statusDot.style.boxShadow ="0 0 14px " + ringColor[profileItr];
    profileChangeRing.style.setProperty("--ring-color",ringColor[profileItr]);
}
changeProfilePicture();
myFaceImage.addEventListener("mouseenter",() =>{
    startTime = Date.now();
    hoverProfileInterval = setInterval(() => {
        const time = ((Date.now() - startTime));
        percentageOfTime = Math.min(1,(time/3000));
        profileChangeRing.style.setProperty("--progress",`${percentageOfTime*360}deg`); 
        if(time >= 3000){
            changeProfilePicture();
            startTime = Date.now();
        }
    },100);
});
myFaceImage.addEventListener("mouseleave",()=>{
    profileChangeRing.style.setProperty("--progress",`${0}deg`); 
    clearInterval(hoverProfileInterval);
});

const translateBtn = document.getElementById('translateBtn');
const translateLabel = document.getElementById('translateLabel');
let lang = 'en';
let animating = false;

const content = {
    en: {
        tagLine: '> whoami',
        name: 'Freyr',
        status: 'Computer Engineering Student\n@ Chulalongkorn University',
        interestLabel: '// areas of interest',
        interests: ['Backend Engineering', 'Competitive Programming'],
        btns: ['Email', 'Discord', 'GitHub'],
    },
    th: {
        tagLine: '> ฉันคือใคร',
        name: 'เฟรย์',
        status: 'วิศวกรรมคอมพิวเตอร์\n@ จุฬาลงกรณ์มหาวิทยาลัย',
        interestLabel: '// สาขาที่สนใจ',
        interests: ['ซอฟต์แวร์ระบบหลังบ้าน', 'การเขียนโปรเเกรมเชิงเเข่งขัน'],
        btns: ['อีเมล', 'ดิสคอร์ด', 'กิตฮับ'],
    }
};

const CHARS = {
    en:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234!@#$%&',
    th:'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ'
}

function scramble(el, target, duration = 600, isHTML = false) {
    const plain = target.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
    const totalFrames = Math.round(duration / 16);
    let frame = 0;

    const tick = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;

        const scrambled = plain.split('').map((char, i) => {
            if (char === ' ' || char === '\n') return char;
            if (i / plain.length < progress) return char;
            return CHARS[lang][Math.floor(Math.random() * CHARS[lang].length)];
        }).join('');

        el.textContent = scrambled;

        if (frame >= totalFrames) {
            clearInterval(tick);
            if (isHTML) {
                el.innerHTML = target;
            } else {
                el.innerHTML = target.replace(/\n/g, '<br>');
            }
        }
    }, 16);
}

function scrambleName(el, target, duration = 700) {
    const totalFrames = Math.round(duration / 16);
    let frame = 0;
    const tick = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const scrambled = target.split('').map((char, i) => {
            if (i / target.length < progress) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('');
        el.innerHTML = scrambled + '<span class="cursor">_</span>';
        if (frame >= totalFrames) {
            clearInterval(tick);
            el.innerHTML = target + '<span class="cursor">_</span>';
        }
    }, 16);
}

translateBtn.addEventListener('click', () => {
    if (animating) return;
    animating = true;
    lang = lang === 'en' ? 'th' : 'en';
    const d = content[lang];
    translateLabel.textContent = lang === 'en' ? 'EN / TH' : 'TH / EN';
    translateBtn.classList.toggle('active', lang === 'th');
    const delays = [0, 80, 160, 240, 320, 400];
    const targets = [
        { el: document.querySelector('.tag-line'),      text: d.tagLine,        delay: delays[0] },
        { el: document.querySelector('.name-txt'),      text: d.name,           delay: delays[1], isName: true },
        { el: document.querySelector('.status-txt'),    text: d.status,         delay: delays[2] },
        { el: document.querySelector('.interest-label'),text: d.interestLabel,  delay: delays[3] },
    ];
    targets.forEach(({ el, text, delay, isName }) => {
        setTimeout(() => {
            if (isName) scrambleName(el, text, 650);
            else scramble(el, text, 600);
        }, delay);
    });
    const items = document.querySelectorAll('.interest-list li');
    items.forEach((li, i) => {
        setTimeout(() => scramble(li, d.interests[i], 550), delays[4] + i * 80);
    });
    const btns = document.querySelectorAll('.contact-btn');
    btns.forEach((btn, i) => {
        setTimeout(() => scramble(btn, d.btns[i], 450), delays[5] + i * 60);
    });
    setTimeout(() => { animating = false; }, 1100);
});
