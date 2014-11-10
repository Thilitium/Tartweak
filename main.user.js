// ==UserScript==
// @name         Targate
// @namespace    http://targate.fr/
// @version      0.1
// @description  enter something useful
// @author       You
// @match        http://tampermonkey.net/index.php?version=3.9&ext=dhdg&updated=true
// @grant		 GM_log
// @include      http://targate.fr/index.php
// @include   	 http://targate.fr/index.php?choix=general&*
// ==/UserScript==


DEBUG = true;
//GM_log=console.log;
String.prototype.removeQuotes = function() { 
   return this.replace(/[\\"']/g, '').replace(/\u0000/g, '');
};

var User = {
    Planetes : [],
    Technos : []
};

// Fonctions concernant le moteur du jeu
var Moteur = {
	// Obtient le type du bâtiment passé.
	TypeBatiment: function(batName) {
        // Récupération du type de bâtiment
        if(batName.indexOf("Centrale") >= 0)
        	return "Energie";
        else if(batName.indexOf("Mine") >= 0)
        	return "Ressources";
        else if(batName.indexOf("Ferme") >= 0)
        	return "Ressources";
        else if(batName.indexOf("Recherche") >= 0)
        	return "Installation";
        else if(batName.indexOf("Chantier") >= 0)
        	return "Installation";
        else if(batName.indexOf("Hôpital") >= 0)
        	return "Installation";
        else if(batName.indexOf("Terraformeur") >= 0)
        	return "Installation";
        else if(batName.indexOf("Caserne") >= 0)
        	return "Militaire";
        else if(batName.indexOf("Station Orbitale") >= 0)
        	return "Militaire";
        else if(batName.indexOf("Radar") >= 0)
        	return "Militaire";
        else if(batName.indexOf("Centre de Commande") >= 0)
        	return "Militaire";
        else if(batName.indexOf("Entrepôt") >= 0)
        	return "Stockage";
        else
        	GM_log("Bâtiment de type non reconnu : " + batName);
	}
};

// Interface utilisateur
var Ui = {
	root: null,
	GenererCSS:function() {
		var strCss = "<style>" +
						".displaynone {" +
							"display:none;" +
						"}" +
						"#tartweak {" +
							"z-index: 11;" +
							"top: 0;" +
							"position: absolute;" +

							"background-color: whitesmoke;" +

							"border: 2px solid darkgrey;" +
							"font-size: 0.7em;" +
						"}" +
						"#tartweaktoggle {" +
							"min-width: 20px;" +
							"min-height: 20px;" +
							"background-color: red;" +
						"}" +
						"#ttartweak {" +
							"border-collapse: collapse;" +
						"}" +
						"#ttartweak.tttopen {" +
							"display: table;" +
						"}" +
						"#ttartweak.tttclosed {" +
							"display: none;" +
						"}" +
						"#ttartweak td, #ttartweak th {" +
							"border: 1px solid darkgreen;" +
						"}" +
						"#ttartweak td {" +
							"text-align:right;" +
						"}" +
						"#ttartweak th {" +
							"color:darkblue;" +
						"}" +
						"#ttartweak tr.Energie td, #ttartweak tr.Energie th { " +
							"background-color:goldenrod;" +
						"}" +
						"#ttartweak tr.Ressources td, #ttartweak tr.Ressources th { " +
							"background-color:salmon;" +
						"}" +
						"#ttartweak tr.Installation td, #ttartweak tr.Installation th { " +
							"background-color:lightgray;" +
						"}" +
						"#ttartweak tr.Militaire td, #ttartweak tr.Militaire th { " +
							"background-color:lightgreen;" +
						"}" +
					"</style>";
		var head = document.getElementsByTagName("head")[0];
		head.innerHTML = head.innerHTML + strCss;
	},
  	// Génération de la table
    GenererTable:function(planetes) {
    	// Variable d'itération, contient le code des planètes à chaque fois.
    	var codeP;

    	// On génère le tableau avec le nom des planètes.
    	var strHtml = 	"<div id='tartweak'>"+
    						"<div id='tartweaktoggle'></div>" +
    						"<table id='tmenutartweak'>"+
    							"<tr id='tttrchoix'>" +
    								"<td id='tdbatiments'>B&acirc;timents</td>" +
    								"<td id='tdtechnologies'>Technologies</td>" +
    								"<td id='tdarmee'>Arm&eacute;e</td>" +
    							"</tr>" + 
    						"</table>" +
    				      	"<table id='ttartweak' class='tttopen'>" +
    							"<thead>" +
    								"<tr>" +
    									"<th>Plan&egrave;tes</th>";
    									// Noms des planètes
								   		for(codeP in planetes) strHtml+= "<th>" + planetes[codeP].nom + "</th>";
    	strHtml +=					"</tr>" +
    								"<tr><th>Or</th>" ;
    									// Or des planètes
    									for(codeP in planetes) strHtml+= "<td id='tttorplanete" + codeP + "'></td>";
    	strHtml +=					"</tr>" +
    								"<tr><th>Titane</th>" ;
    									// Titane des planètes
    									for(codeP in planetes) strHtml+= "<td id='ttttitaneplanete" + codeP + "'></td>";
    	strHtml +=					"</tr>" +
    								"<tr><th>Tritium</th>" ;
    									// Tritium des planètes
    									for(codeP in planetes) strHtml+= "<td id='ttttritiumplanete" + codeP + "'></td>";
    	strHtml +=					"</tr>" +
    								"<tr><th>Nourriture</th>" ;
    									// Nourriture des planètes
    									for(codeP in planetes) strHtml+= "<td id='tttnourritureplanete" + codeP + "'></td>";
    	strHtml +=					"</tr>" +
    							"</thead>" +
    							"<tbody id='tttbodybatiments'></tbody>" +
    					  	"</table>" +
    				  	"</div>";
    	// On accroche le tableau au tout début de la page
    	var body = document.getElementsByTagName("body")[0];
    	body.innerHTML = strHtml + body.innerHTML;
    	root = document.getElementById("tartweak");

    	// Evènements toggle
    	document.getElementById("tartweaktoggle").onclick = function() {
    		var table = document.getElementById("ttartweak");
    		if(table.getAttribute("class")==="tttopen")
    			table.setAttribute("class", "tttclosed");
    		else
    			table.setAttribute("class", "tttopen");
    	};

    	// Evènements de changement du tableau affiché
    	var tdBat = document.getElementById("tdbatiments");
    	var tdTec = document.getElementById("tdtechnologies");
    	var tdArm = document.getElementById("tdarmee");

    	var toggleTab = function() {
    		var trTog = document.getElementById("tttrchoix");
    		for(var i=0;i<trTog.children.length; ++i) {
    			
    		}
    	};

	},
	AfficherRessoures: function(codePlanete, ress) {
		// Récupération des éléments de tableau où afficher les ressources.
		var tdOr = document.getElementById("tttorplanete"+codePlanete);
		var tdTi = document.getElementById("ttttitaneplanete"+codePlanete);
		var tdTr = document.getElementById("ttttritiumplanete"+codePlanete);
		var tdNo = document.getElementById("tttnourritureplanete"+codePlanete);

		// Affichage des ressources
		tdOr.innerHTML = ress.or.val + "<br/>" + ress.or.max;
		tdTi.innerHTML = ress.titane.val + "<br/>" + ress.titane.max;
		tdTr.innerHTML = ress.tritium.val + "<br/>" + ress.tritium.max;
		tdNo.innerHTML = ress.nourriture.val + "<br/>" + ress.nourriture.max;
	},
	AfficherBatiment:function(codePlanete, bat) {
		// Vérification que la planète existe.
		if(User.Planetes[codePlanete]===undefined) {
			GM_log("Affichage: Impossible de trouver la planete " + codePlanete);
		}

		var trBat = document.getElementById("tr"+bat.nom);
		if (trBat===undefined||trBat===null) {

			// Si la ligne de bâtiment n'existe pas, on la créé.
			var strBat="<tr id='tr" + bat.nom + "' class='" + bat.typeBat + "'><th>" + bat.nom + "</th>";
			for(var i in User.Planetes) strBat += "<td id='tdbat"+ bat.nom + i + "'></td>";
			strBat += "</tr>";

			// récupération du tbody du tableau et ajout de la ligne générée
			var tBod = document.getElementById("tttbodybatiments");
			tBod.innerHTML = tBod.innerHTML + strBat;
		}
		// Récupération des liens de construction/destruction
		var strConstruire = "";
		if(bat.liens.construire !== null) {
			strConstruire = "<a id='aconstruirebat" + bat.nom + codePlanete + "' onclick='javascript:void(0);'>[+]</a>";
		} else {
			strConstrure = "[+]";
		}

		// Ajout du niveau du batiment récupéré dans la bonne ligne/cellule.
		var cell = document.getElementById("tdbat"+bat.nom+codePlanete);
		cell.innerHTML = bat.niveau + strConstruire;

		// Ajout du gestionnaire d'évènement pour destruction du batiment
		var lien = document.getElementById("aconstruirebat"+bat.nom+codePlanete);
		if(lien !== undefined && lien !== null) {
			var tmp = this;
			lien.onclick = function() { 
				if (tmp!==null) tmp.construire(codePlanete, bat); 
			};
		}
	},
	AfficherTechno:function(tech) {

	},
	AfficherArmee:function(armee) {

	},
	AfficherPlanetes:function(planetes) {

	},
	construire:null  
};

// Requêtage des informations
var Data = {
	"Planetes" : {
		GetAll: function() {
			var noms=[];
			var codes=[];
			var sel = null;
            var sels = [];
			var nb = 0;
			try {
				// Récupération de l'élément "select" avec les noms de planètes.
				sels = document.getElementsByName("planete");
				for (var i=0;i<sels.length;++i) {
					if (sels[i].tagName.toUpperCase() === "SELECT") {
						sel = sels[i]; 
                        i=sels.length;
					}
				}

				// Récupération des noms de planetes
				nb = sel.children.length;
				for (i=0;i<nb;++i){
					noms.push(sel.children[i].text.removeQuotes());
					codes.push(sel.children[i].getAttribute("value"));
				}
			} catch(err) {
				if (this.onerror !== null) this.onerror(err);
			}

			if (this.onreceived !== null) this.onreceived(noms, codes, nb);
			if (this.onfinished !== null) this.onfinished();
		},
		onreceived: null,
		onfinished: null,
		onerror: null
	},
	"Batiments" : {
		GetAll: function() {
			// On vérifie qu'on a bien au moins une planète.
			if(User.Planetes.length<=0) {
				if (onerror!==null) onerror("Aucune planète.");
				return;
			}

			// Instaure un délai entre chaque requête pour éviter de tout envoyer d'un coup.
            var codes =[];
            var iCode = 0;

            // Fonction de récupération des données pour une planète
            function Pull(codeP, callback, error) {
        	    // Requête sur la page des bâtiments.
                var xhr = new XMLHttpRequest();
                var params = "planete="+codeP;	// Code de la planète de provenance. Nécessaire dans le form.
                
                // Configuration de la requête vers la page des bâtiments.
                xhr.open("POST", "index.php?choix=batiment&p="+codeP, true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.setRequestHeader("Accep-Encoding", "gzip,deflate,sdch");
                xhr.setRequestHeader("Accept-Language", "fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4");
                //xhr.setRequestHeader("Content-Length", 12); // UNSAFE HEADER

                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4) {
                        // Récupération de la page des batiments.
                        var body = Data.GetPageBody(xhr.responseText);
                        
                        // On réupère les ressources
                        Data.Ressources.GetRessourcesDepuisPage(codeP, body);

                        // Récupération de tous les éléments contenant les batiments.
                        var batNamesEl = body.getElementsByClassName("btitre");
                        if(batNamesEl.length<=0) {
                        	// si aucun élément trouvé, on a une erreur (mauvaise page ?)
                            if(error!==null) error("ERREUR de récupération des bâtiments à la planète i"+iCode+", arrêt de la récup.");
                        } else {
                        	// Pour chaque nom, découpage de la string pour extraire le level.
                            var batName, batLvl, batType;
                            var txt ="";
                            for(var i=0;i<batNamesEl.length;++i) {
                                txt = batNamesEl[i].innerHTML;
                                batName = txt.substring(0, txt.indexOf("<br>")).removeQuotes();
                                batType = Moteur.TypeBatiment(batName);
                                batLvl = txt.substring(txt.indexOf("<br>") + 8, txt.length);
                                var liens = {
                                	construire: null,
                                	detruire: null,
                                	annuler: null
                                };
								
								var parentForm = batNamesEl[i].parentElement;
								var ok = false;

								// On regarde si la construction d'un niveau est en cours
								if (parentForm.getElementsByClassName("btemps").length > 0)  {
									var newNiv = parseInt(batLvl) + 1;
									batLvl+= " (" + newNiv + ")";
								}

								// On regarde si la construction est autorisée
								for(var j=0; j<parentForm.children.length; ++j){
									if(parentForm.children[j].getAttribute("class") === 'validBoutonSmall') ok = true;
								}

								if (ok) {
									var postArgName = parentForm.getElementsByTagName("input")[0].getAttribute("name"); // construction_cour
									var postArgVal = parentForm.getElementsByTagName("input")[0].getAttribute("value");

									liens = {
										construire: {
											url: "index.php?choix=batiment&p="+codeP,
											args: [{
												nom: postArgName,
												val: postArgVal
											}, {
												nom: postArgName+".x",
												val: 10
											}, {
												nom: postArgName+".y",
												val: 10
											}, {
												nom: postArgName,
												val: postArgVal
											}]
										},
										detruire: null,
										annuler: null
									};
								}

                                // Appel du callback de bâtiment trouvé.
                                if(callback!==null) callback(codeP, batName, batLvl, batType, liens, {});
                            }
                        }
                    }
                }; 
                xhr.send(params); 
            }

            for(var codeP in User.Planetes) {
            	Pull(codeP, this.onreceived, this.onerror);
            }
		},
		ConstruireBat: function(codePlanete, bat){
			if (bat.liens.construire!==null) {
				// Requête sur la page des bâtiments.
                var xhr = new XMLHttpRequest();

                // TODO: Boucler sur les paramètres, on ne sait jamais...
                var params = bat.liens.construire.args[0].nom+"="+bat.liens.construire.args[0].val;
                
                // Configuration de la requête vers la page des bâtiments.
                xhr.open("POST", "index.php?choix=batiment&p="+codePlanete, true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.setRequestHeader("Accep-Encoding", "gzip,deflate,sdch");
                xhr.setRequestHeader("Accept-Language", "fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4");
                //xhr.setRequestHeader("Content-Length", 12); // UNSAFE HEADER

                xhr.onreadystatechange = function() {
                    //TODO: Mettre à jour le tableau ?
                    if (xhr.readyState == 4) {
                        // Récupération de la page des batiments.
                        var body = Data.GetPageBody(xhr.responseText);
                        Data.Ressources.GetRessourcesDepuisPage(codePlanete,body);
                    }
                }; 
                xhr.send(params); 
			} else GM_log("Erreur lors de la tentative de construction du niveau.");
		},
		onreceived: null,
		onfinished: null,
		onerror: null
	},
	"Technos" : {
		GetAll: function() {

		},
		onreceived: null,
		onfinished: null,
		onerror: null
	},
	"Armee" : {
		GetAll: function() {

		},
		onreceived: null,
		onfinished: null,
		onerror: null
	},
	"Ressources" : {
		GetRessourcesDepuisPage: function(codeP, pageBody) {
			// Récupération des éléments contenant les ressources dans la page.
			var orEl = pageBody.getElementsByClassName("typeOr")[0];
			var titaneEl = pageBody.getElementsByClassName("typeTitane")[0];
			var tritiumEl = pageBody.getElementsByClassName("typeTritium")[0];
			var nourritureEl = pageBody.getElementsByClassName("typeNourriture")[0];

			// Récupération des valeurs brutes à l'intérieur des éléments.
			var orVal = orEl.children[0].children[0].innerText;
			var orMax = orEl.children[0].children[2].innerText;
			var titaneVal = titaneEl.children[0].children[0].innerText;
			var titaneMax = titaneEl.children[0].children[2].innerText;
			var tritiumVal = tritiumEl.children[0].children[0].innerText;
			var tritiumMax = tritiumEl.children[0].children[2].innerText;
			var nourritureVal = nourritureEl.children[0].children[0].innerText;
			var nourritureMax = nourritureEl.children[0].children[2].innerText;

			if(this.onreceived!==null) this.onreceived(codeP, {
				or: {
					val: orVal,
					max: orMax
				},
				titane: {
					val: titaneVal,
					max: titaneMax
				},
				tritium: {
					val: tritiumVal,
					max: tritiumMax
				},
				nourriture: {
					val: nourritureVal,
					max: nourritureMax
				}
			});
		},
        onreceived: null
	},
	GetPageBody: function(responseText) {
		var bodyStr = responseText.substring(responseText.indexOf("<body>") + 6, responseText.indexOf("</html>") - 15);
        var body = document.createElement('div');
        body.innerHTML = bodyStr;
        return body;
	}
};

// Gestion des évènements.
var Events = {
	// Evènements de données
	"Data" : function() {
		// Evènement concernant les données des planètes.
		var PlanetEvents = function() {
			Data.Planetes.onreceived = function(noms, codes, nb) {
				// Parcours des planètes et génération des objets avec les codes.
				for(var i=0;i<nb;++i) {
					User.Planetes[codes[i]] = {
						nom: noms[i]
					};
				}

				// Vérification qu'on ai toujours le même nombre de planètes...
				if(User.Planetes.length != nb) {
					// Si c'est pas le cas on supprime celles qu'on n'a plus
					User.Planetes.forEach(
						function(el, index) {
							var ok=false;
							for(var i=0;i<nb;++i) if(el.nom==noms[i]) ok=true;
							if(!ok) el=undefined;
						}
					);
				}
			};
			Data.Planetes.onerror = function(err) { 
				GM_log("Err: " + err);
				//TODO: Retenter la récupération.
			};
			Data.Planetes.onfinished = function() {
				Data.Batiments.GetAll();
				Ui.GenererTable(User.Planetes);
			};
		};

		var BatimentsEvents = function() {
			Data.Batiments.onreceived = function(codePlanete, nom, niveau, typeBat, liens, prix) {
				// Si on ne trouve pas la planète demandée on notifie.
				if(User.Planetes[codePlanete]===undefined) {
					GM_log("Planète '"+codePlanete+"' non trouvée.");
					return;
				}
				if(DEBUG) GM_log("Planète " + codePlanete + " - " + nom + " (" + niveau + ")" + "chargé.");
                var planete = User.Planetes[codePlanete];
                if(planete.Batiments===undefined) planete.Batiments = [];
				var bat = planete.Batiments[nom];
                if (bat===undefined) bat = {};
				bat.nom = nom;
				bat.niveau = niveau;
				bat.liens = liens;
				bat.prix = prix;
				bat.typeBat = typeBat;

				Ui.AfficherBatiment(codePlanete, bat);
			};
            Data.Batiments.onerror = function(msg) {
            	GM_log(msg);  
            };

            // Gestion d'une demande de construction d'un bâtiment.
            Ui.construire = function(codePlanete, bat) {
            	Data.Batiments.ConstruireBat(codePlanete, bat);
            };
		};

		var RessourcesEvents = function() {
			Data.Ressources.onreceived = function(codeP, ress) {
				User.Planetes[codeP].Ressources = ress;
				Ui.AfficherRessoures(codeP, ress);
			};
		};

		PlanetEvents();
		BatimentsEvents();
		RessourcesEvents();

	}
};

function Main() {
    if(document.getElementsByClassName("inscriptionTitre").length<=0) {
    	// Génération du CSS de la page
    	Ui.GenererCSS();
        // Initialisation des évènements de données.
        Events.Data();
        // Récupération de toutes les planètes.
        Data.Planetes.GetAll();
    }
}

Main();