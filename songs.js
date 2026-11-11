// Song list (categories and titles only).
// Lyrics live in lyrics/<Song Title>.txt. After adding or editing a .txt file, run:
//   powershell -ExecutionPolicy Bypass -File build.ps1
// To add a new song: add its title here and create lyrics/<Song Title>.txt with the same name.
const CATEGORIES = [
  { name: "Vinayaka Songs", songs: [
    { title: "Bujji Bujji Ganapayya" },
    { title: "Kanipaka Ganapathi" },
  ]},
  { name: "Subramanyam Swamy Songs", songs: [
    { title: "Raava Muruga" },
  ]},
  { name: "Venkateswara Swamy Songs", songs: [
    { title: "Adhi Shesa Anantha Sayana" },
  ]},
  { name: "Sivudu Songs", songs: [
    { title: "Lingastakam" },
    { title: "Sivude Dhevudani" },
  ]},
  { name: "Amma vaari Songs", songs: [
    { title: "Dhigu Dhigu Naga" },
  ]},
  { name: "Ayyappa Songs", songs: [
    { title: "Raava Ayyappa Swamy" },
    { title: "Ammavaru undedhi vaikuntam" },
    { title: "Kondala Kondala" },
    { title: "Dhevudu vachinaduro" },
    { title: "Mallepula Pallaki" },
    { title: "Challandi Bhantipulu" },
    { title: "Bhagavan Sharanam" },
    { title: "Akkada Unnavayyappa" },
    { title: "Oogu Oogu Uyyala" },
  ]},
];
