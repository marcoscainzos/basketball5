const famousNumbers: Record<string, number> = {
  "Michael Jordan": 23, "LeBron James": 23, "Kobe Bryant": 24, "Shaquille O'Neal": 34,
  "Stephen Curry": 30, "Kevin Durant": 35, "Magic Johnson": 32, "Larry Bird": 33,
  "Kareem Abdul-Jabbar": 33, "Wilt Chamberlain": 13, "Bill Russell": 6, "Tim Duncan": 21,
  "Hakeem Olajuwon": 34, "Dirk Nowitzki": 41, "Kevin Garnett": 21, "Allen Iverson": 3,
  "Dwyane Wade": 3, "Julius Erving": 6, "Oscar Robertson": 14, "Jerry West": 44,
  "Karl Malone": 32, "John Stockton": 12, "Charles Barkley": 34, "Scottie Pippen": 33,
  "David Robinson": 50, "Patrick Ewing": 33, "Isiah Thomas": 11, "Steve Nash": 13,
  "Jason Kidd": 5, "Ray Allen": 20, "Paul Pierce": 34, "Reggie Miller": 31,
  "Dennis Rodman": 91, "Vince Carter": 15, "Tracy McGrady": 1, "Carmelo Anthony": 7,
  "Russell Westbrook": 0, "James Harden": 13, "Chris Paul": 3, "Kawhi Leonard": 2,
  "Damian Lillard": 0, "Anthony Davis": 3, "Giannis Antetokounmpo": 34, "Nikola Jokic": 15,
  "Luka Doncic": 77, "Joel Embiid": 21, "Jayson Tatum": 0, "Jaylen Brown": 7,
  "Jimmy Butler": 10, "Paul George": 13, "Klay Thompson": 11, "Draymond Green": 23,
  "Donovan Mitchell": 45, "Devin Booker": 1, "Trae Young": 11, "Ja Morant": 12,
  "Zion Williamson": 1, "Victor Wembanyama": 1, "Shai Gilgeous-Alexander": 2,
};

const currentNumbers: Record<string, number> = {
  "Aaron Gordon": 32, "Alex Caruso": 9, "Alperen Sengun": 28, "Amen Thompson": 1,
  "Anthony Edwards": 5, "Austin Reaves": 15, "Bam Adebayo": 13, "Brandon Ingram": 3,
  "Cade Cunningham": 2, "Chet Holmgren": 7, "Cooper Flagg": 32, "Darius Garland": 10,
  "De'Aaron Fox": 4, "DeMar DeRozan": 10, "Derrick White": 9, "Desmond Bane": 22,
  "Domantas Sabonis": 11, "Evan Mobley": 4, "Franz Wagner": 22, "Jalen Brunson": 11,
  "Jalen Green": 4, "Jalen Williams": 8, "Jamal Murray": 27, "Jaren Jackson Jr.": 13,
  "Jrue Holiday": 4, "Karl-Anthony Towns": 32, "LaMelo Ball": 1, "Lauri Markkanen": 23,
  "Mikal Bridges": 25, "Paolo Banchero": 5, "Pascal Siakam": 43, "Rudy Gobert": 27,
  "Scottie Barnes": 4, "Tyler Herro": 14, "Tyrese Maxey": 0, "Zach LaVine": 8,
  "Zion Williamson": 1, "LeBron James": 23, "Luka Doncic": 77, "Stephen Curry": 30,
  "Nikola Jokic": 15, "Shai Gilgeous-Alexander": 2, "Victor Wembanyama": 1,
};

export function jerseyNumber(name: string, pool: "historical" | "current", stored: number) {
  if (pool === "current" && name in currentNumbers) return currentNumbers[name];
  return famousNumbers[name] ?? stored;
}
