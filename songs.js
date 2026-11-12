// Song list (categories and titles only).
// Lyrics live in lyrics/<Song Title>.txt. After adding or editing a .txt file, run:
//   powershell -ExecutionPolicy Bypass -File build.ps1
// To add a new song: add its title here and create lyrics/<Song Title>.txt with the same name.
// "bg" picks the background behind the lyrics: images/<bg>.jpg (or .png/.webp) if present,
// otherwise a built-in emblem.
const CATEGORIES = [
  { name: "Vinayaka Songs", bg: "vinayaka", songs: [
    { title: "Bujji Bujji Ganapayya" },
    { title: "Kanipaka Ganapathi" },
  ]},
  { name: "Subramanyam Swamy Songs", bg: "subramanya", songs: [
    { title: "Raava Muruga" },
  ]},
  { name: "Venkateswara Swamy Songs", bg: "venkateswara", songs: [
    { title: "Adhi Shesa Anantha Sayana" },
  ]},
  { name: "Sivudu Songs", bg: "shiva", songs: [
    { title: "Lingastakam" },
    { title: "Sivude Dhevudani" },
  ]},
  { name: "Amma vaari Songs", bg: "amma", songs: [
  ]},
  { name: "Ayyappa Songs", bg: "ayyappa", songs: [
    { title: "Raava Ayyappa Swamy" },
    { title: "Ammavaru undedhi vaikuntam" },
    { title: "Kondala Kondala" },
    { title: "Dhevudu vachinaduro" },
    { title: "Mallepula Pallaki" },
    { title: "Challandi Bhantipulu" },
    { title: "Bhagavan Sharanam" },
    { title: "Akkada Unnavayyappa" },
    { title: "Oogu Oogu Uyyala" },
    { title: "Dhigu Dhigu Naga" },
  ]},
];
