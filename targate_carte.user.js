var SHOW_SPIED = false;




// Récupération de l'IFRAME affichant la page de la carte spatiale.
var frameContent = $("iframe").eq(1).contents();

// Récupération de toutes les planètes du niveau chargé de la carte.
var planetes = frameContent.find("div#bg.bg>a.planete");

// Récupération des planètes ayant un champ de tritium aux alentours en attente de recyclage.
var planeteTritium = planetes.find(".planeteTritium");

var joueurs = [];

// Récupération des informations des planètes dans la carte.
for(var iP=0; iP<planetes.length; ++iP) {
	// Récuépration du tooltip de la planète
	var tt = planetes.eq(iP).attr("onmouseover");

	var alreadySpied = (planetes.eq(iP).children("img").attr("style") !== undefined) ? true : false;

	// On tronque le début ('Tip(') et la fin (')') de la fonction d'affichage du tooltip.
	tt = tt.substr(5);
	tt = tt.substring(0, tt.length - 2)

	// On supprime l'échappement des caractères.
	tt = tt.split("\\").join("");

	// On parse la chaine de texte du tooltip pour extraire les informations nécessaires.
	var $tt = $(tt).eq(0);
	//<div style="color:white;">Planète : Planète 6 (6:6:6)<br>Occupant : Vertume (4.697.641 points)<br>Alliance : Just For Fun</div>


	// Récupération du texte brut
	var txtTt = $tt.text();
	//"Planète : Planète 6 (6:6:6)Occupant : Vertume (4.697.641 points)Alliance : Just For Fun"

	var coord = txtTt.substr(txtTt.indexOf("(") + 1, txtTt.indexOf(")") - txtTt.indexOf("(") - 1).split(':');
	//["6", "6", "6"]

	// On tronque la chaîne pour obtenir l'occupant et les points.
	txtTt = txtTt.substr(txtTt.indexOf(")") + 1);

	// Récupération du joueur pour la planète courante
	var joueur = txtTt.substr(txtTt.indexOf(":") + 2, txtTt.indexOf("(") - txtTt.indexOf(":") - 3);
	//"Vertume"

	// Récupération des points du joueurs sous forme d'entier.
	var txtPoints = txtTt.substr(txtTt.indexOf("(") + 1, txtTt.indexOf(" points)") - txtTt.indexOf("(") - 1);
	var intPoints = parseInt(txtPoints.split('.').join(""));	

	if(!(!SHOW_SPIED && alreadySpied)) {
		var objPlayer=null;
		for(var j=0; j<joueurs.length; ++j) {
			if(joueurs[j].nom===joueur){
				objPlayer = joueurs[j];
				continue;
			}
		}
		if (objPlayer===null) {
			objPlayer = {
				nom: joueur,
				txtPoints: txtPoints,
				intPoints: intPoints,
				spied: alreadySpied,
				planetes : []
			};
			joueurs.push(objPlayer);
		};
		objPlayer.planetes.push(coord);
	}
}

// Tri à bulle des joueurs par points DESC.
if (joueurs.length > 1) {
	var tmpPlayer;
	var fini=false;
	while (!fini) {
		fini = true;
		for(var i=1; i<joueurs.length; ++i) {
			if(joueurs[i-1].intPoints<joueurs[i].intPoints) {
				fini = false;
				tmpPlayer = joueurs[i-1];
				joueurs[i-1]= joueurs[i];
				joueurs[i]= tmpPlayer;
			}
		}
	}
}

console.log(joueurs);
















