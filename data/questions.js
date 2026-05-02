'use strict';

const QUESTIONS = [
  {
    text: 'What was the original planned title for Return of the Jedi before George Lucas changed it?',
    options: ['Revenge of the Jedi', 'Return of the Jedi (there was no change)', 'Blue Harvest', 'The Jedi Strike Back'],
    correct: 0,
  },
  {
    text: "In the trash compactor scene in Episode IV: A New Hope, who said \"One thing's for sure — we are all going to be a lot thinner\"?",
    options: ['Han Solo', 'Princess Leia', 'Luke Skywalker', 'C-3PO'],
    correct: 0,
  },
  {
    text: "Which Imperial warlord secretly experiments on Grogu's Force-sensitive blood to create enhanced soldiers for a new Empire?",
    options: ['Grand Admiral Thrawn', 'Governor Pryce', 'Director Krennic', 'Moff Gideon'],
    correct: 3,
  },
  {
    text: "What is the name of Mon Mothma's husband in Andor, whose connections she used to disguise her rebel fundraising?",
    options: ['Perrin Fertha', 'Bail Organa', 'Luthen Rael', 'Tay Kolma'],
    correct: 0,
  },
  {
    text: "What is the industrialized planet — home to Cassian's adoptive mother Maarva — where the Andor series begins and ends?",
    options: ['Ferrix', 'Morlana One', 'Aldhani', 'Scarif'],
    correct: 0,
  },
  {
    text: 'In Revenge of the Sith, on which jungle planet does Yoda fight alongside Wookiee warriors during the execution of Order 66?',
    options: ['Kashyyyk', 'Felucia', 'Mygeeto', 'Utapau'],
    correct: 0,
  },
  {
    text: 'In Revenge of the Sith, on which sinkhole planet does Obi-Wan Kenobi track down and defeat General Grievous?',
    options: ['Utapau', 'Kashyyyk', 'Coruscant', 'Mustafar'],
    correct: 0,
  },
  {
    text: "Who played Queen Amidala's handmaiden and decoy Sabé in The Phantom Menace?",
    options: ['Daisy Ridley', 'Felicity Jones', 'Emilia Clarke', 'Keira Knightley'],
    correct: 3,
  },
  {
    text: "Who serves as the genetic template for the Republic's clone army?",
    options: ['Boba Fett', 'Captain Rex', 'Jango Fett', 'Commander Cody'],
    correct: 2,
  },
  {
    text: 'What type of ship features twin ion engines — the very feature that gives it its name?',
    options: ['TIE Fighter', 'X-Wing', 'Star Destroyer', 'Jedi Starfighter'],
    correct: 0,
  },
  {
    text: 'Who played the role of Jyn Erso in "Rogue One: A Star Wars Story"?',
    options: ['Daisy Ridley', 'Emilia Clarke', 'Keira Knightley', 'Felicity Jones'],
    correct: 3,
  },
  {
    text: 'Who gave Kylo Ren his distinctive facial scar?',
    options: ['Rey', 'Luke Skywalker', 'Supreme Leader Snoke', 'Captain Phasma'],
    correct: 0,
  },
  {
    text: 'How old was Padmé Amidala when she was elected Queen of Naboo?',
    options: ['14', '13', '16', '17'],
    correct: 0,
  },
  {
    text: "What is Yoda's home planet?",
    options: ['Never revealed', 'Dagobah', 'Forest Moon of Endor', 'Ach-To'],
    correct: 0,
  },
  {
    text: 'How is Kylo Ren related to Luke Skywalker?',
    options: ['Nephew', 'Cousin', 'Not related', 'Son'],
    correct: 0,
  },
  {
    text: 'How many languages can C-3PO speak?',
    options: ['6 million', '10 thousand', '10 million', '500'],
    correct: 0,
  },
  {
    text: 'What is the highest-grossing Star Wars movie — adjusted for inflation?',
    options: ['The Force Awakens', 'A New Hope', 'Return of the Jedi', 'Revenge of the Sith'],
    correct: 1,
  },
  {
    text: 'What does Yoda say is the path to the dark side?',
    options: ['Fear', 'Anger', 'Hate', 'Love'],
    correct: 0,
  },
  {
    text: 'Sound designers created the distinctive engine sound of the Millennium Falcon from what real-world source?',
    options: ['A 1965 Ford Mustang', 'A malfunctioning hotel air conditioner', 'An industrial coffee grinder on low speed', '4 hair dryers running simultaneously'],
    correct: 1,
  },
  {
    text: 'What do the letters AT-AT stand for in the Imperial ground assault walkers?',
    options: ['All-Terrain Armored Transport', 'Advanced Terrain Assault Tank', 'Arctic Terrain Assault Transport', 'Advanced Tactical Armored Transport'],
    correct: 0,
  },
  {
    text: 'What was the last Star Wars film to be released on VHS?',
    options: ['Episode II: Attack of the Clones', 'Episode III: Revenge of the Sith', 'Episode I: The Phantom Menace', 'Return of the Jedi'],
    correct: 0,
  },
  {
    text: "What real-world city served as the inspiration for Han Solo's home planet Corellia?",
    options: ['Venice', 'London', 'New York', 'Naples'],
    correct: 0,
  },
  {
    text: "How much did Peter Mayhew's Chewbacca costume weigh?",
    options: ['8 pounds', '150 pounds', '40 pounds', '25 pounds'],
    correct: 0,
  },
  {
    text: 'The first two Star Wars anthology films — Rogue One and Solo — each end with a ship en route to which location?',
    options: ['Tatooine', 'Coruscant', 'Yavin 4', 'Moon of Endor'],
    correct: 0,
  },
];

module.exports = QUESTIONS;
