// ==UserScript==
// @name        Targate-Carte
// @namespace   http://userscripts.org/users/
// @include 	http://targate.fr/*
// @include     http://www.targate.fr/*
// @include     https://targate.fr/*
// @version     0.0.1
// @require 	http://code.jquery.com/jquery-2.1.4.min.js
// @grant       GM_log
// ==/UserScript==
// Script offrant des options étendues sur la carte galactique.


var SHOW_SPIED = false;


function submitFormTritium(x,y,z) {
    var xhr;
    try {  xhr = new ActiveXObject('Msxml2.XMLHTTP');   }
    catch (e) {
        try { xhr = new ActiveXObject('Microsoft.XMLHTTP'); }
        catch (e2) {
           try { xhr = new XMLHttpRequest(); }
           catch (e3) {  xhr = false; }
         }
    }
  
    xhr.onreadystatechange  = function() {
       	if(xhr.readyState  == 4) {
	        if(xhr.status  == 200) {
				//alert("tito");
	            //document.ajax.dyn="Received:"  + xhr.responseText;		
				$("#espaceMessage").innerHTML=xhr.responseText;
			} else {
	            document.ajax.dyn="Error code " + xhr.status;
			}
        }
    };
	var urlFin  = 'x_ennemi_tritium=' + x + '&y_ennemi='+ y +'&z_ennemi='+ z;
	var url = "galaxieAccueil_requete.php?" + urlFin;
	xhr.open( "GET", url,  true);
	xhr.send(null);
} 



var Data = {
	GetZPlanets : function(callback) {
		var hasTritium;

		// Récupération de l'IFRAME affichant la page de la carte spatiale.
		var frameContent = $("iframe").eq(1).contents();

		// Récupération de toutes les planètes du niveau chargé de la carte.
		var planetes = frameContent.find("div#bg.bg>a.planete");

		// Récupération des planètes ayant un champ de tritium aux alentours en attente de recyclage.
		var planeteTritium = planetes.find(".planeteTritium");

		var joueurs = [];

		// Récupération des informations des planètes dans la carte.
		for(var iP=0; iP<planetes.length; ++iP) {
			var hasTritium = planetes.eq(iP).hasClass("planeteTritium");
			var intTritium = 0;
			var txtTritium = "0";
			var lienTritium = null;

			// Récuépration du tooltip de la planète
			var toolTipHTML = planetes.eq(iP).attr("onmouseover");

			var alreadySpied = (planetes.eq(iP).children("img").attr("style") !== undefined) ? true : false;

			// On tronque le début ('Tip(') et la fin (')') de la fonction d'affichage du tooltip.
			toolTipHTML = toolTipHTML.substr(5);
			toolTipHTML = toolTipHTML.substring(0, toolTipHTML.length - 2);

			// On supprime l'échappement des caractères.
			toolTipHTML = toolTipHTML.split("\\").join("");

			// On parse la chaine de texte du tooltip pour extraire les informations nécessaires.
			var $toolTipDiv = $(toolTipHTML).eq(0);
			//<div style="color:white;">Planète : Planète 6 (6:6:6)<br>Occupant : Vertume (4.697.641 points)<br>Alliance : Just For Fun</div>


			// Récupération du texte brut
			var txtTt = $toolTipDiv.text();
			//"Planète : Planète 6 (6:6:6)Occupant : Vertume (4.697.641 points)Alliance : Just For Fun"

			var coord = txtTt.substr(txtTt.indexOf("(") + 1, txtTt.indexOf(")") - txtTt.indexOf("(") - 1);
			var coordSplit = coord.split(":");
			//["6", "6", "6"]

			// On tronque la chaîne pour obtenir l'occupant et les points.
			txtTt = txtTt.substr(txtTt.indexOf(")") + 1);

			// Récupération du joueur pour la planète courante
			var joueur = txtTt.substr(txtTt.indexOf(":") + 2, txtTt.indexOf("(") - txtTt.indexOf(":") - 3);
			//"Vertume"

			// Récupération des points du joueurs sous forme d'entier.
			var txtPoints = txtTt.substr(txtTt.indexOf("(") + 1, txtTt.indexOf(" points)") - txtTt.indexOf("(") - 1);
			var intPoints = parseInt(txtPoints.split('.').join(""));	

			// Récupération du montant de tritium sur la planete :
			if(hasTritium) {
				var aElTritium = $(toolTipHTML).eq(2);
				txtTritium = aElTritium.substr(aElTritium.indexOf("(") + 1, aElTritium.indexOf(")") - aElTritium.indexOf("tritium") - 10);
				intTritium = parseInt(txtTritium.split(".").join(""));
				lienTritium = aElTritium.attr("href");
			}

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
						nom 		: joueur,
						txtPoints 	: txtPoints,
						intPoints 	: intPoints,
						planetes  	: []
					};
					joueurs.push(objPlayer);
				};
				objPlayer.planetes.push({
					nom			: "",
					coord 		: coord,
					x 			: parseInt(coordSplit[0]),
					y 			: parseInt(coordSplit[1]),
					z 			: parseInt(coordSplit[2]),
					txtTritium 	: txtTritium,
					intTritium 	: intTritium,
					lienTritium : "targate.fr/lienTritium"
				});
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

		if(callback!==null) callback(joueurs);
	}
};








var UI = {
	_$div : null,
	InitPanel : function(callback) {
		_$div = $("<div style='"+
						"border:2 px solid black;"+
						"border-radius:5px;"+
						"position:fixed;"+
						"top:250px;"+
						"left:400px;" +
						"z-index:999;' />");

		_$div.prependTo($("body"));



		if (callback !== undefined && callback !== null) callback();
	},
	ShowPlayersList: function(players) {
		var divHTML = "";
		var curPlayer = null;
		var curPlanete = null;
		var txtPlanete = "";

		for(var iPlayer=0; iPlayer<players.length; ++iPlayer) {
			curPlayer = players[iPlayer];
			for(var iPlanete=0: iPlanete<curPlayer.planetes.length; ++iPlanete) {
				// Compilation du texte à afficher pour présenter la planète.
				// Forme : Nom Planete <a href='collecter'> 100.000 Tritium </a>
				txtPlanete = curPlanete;
				if (curPlanete.intTritium > 0) {
					txtPlanete += 
						"<a href='" + curPlanete.lienTritium + "' id='tttplanete" + ((iPlayer + 1) * iPlanete) + "'>" + 
							"&nbsp;&nbsp;&nbsp;" + curPlanete.txtTritium + " tritium" +
						"</a>";
				}
				divHTML += 
					"<div style='width:100%'>" +
						"<span>" + curPlanete + "</span>" +
					"</div>";
			}
		}

		_$div.append(divHTML);

		// Application des gestionnaires d'évènements sur le clic du lien de récolte de tritium
		for(iPlayer=0; iPlayer<players.length; ++iPlayer) {
			curPlayer = players[iPlayer];
			for(iPlanete=0; iPlanete<curPlayer.planetes.length; ++iPlanete) {
				curPlanete = curPlayer.planetes[iPlanete];
				var xP = curPlanete.x;
				var yP = curPlanete.y;
				var zP = curPlanete.z;
				$("#tttplanete"+((iPlayer + 1) * iPlanete)).click(function() {
					submitFormTritium(xP,yP,zP);
					return false;
				});
			}
		}
	}
};













// Gestionnaire d'évènement de l'ouverture de la carte galactique.
$("#main").click(function() {
	setTimeout(function() {
		// Déclenchement de l'initialisation du panel puis de la récupération des planètes
		// et enfin l'affichage de ces dernières.
		UI.InitPanel(function() {
			Data.GetZPlanets(function(planets) {
				UI.ShowPlayersList(planets);
			});
		});
	}, 1500);
});









