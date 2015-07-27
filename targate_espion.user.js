// ==UserScript==
// @name        Targate-Espionnage
// @namespace   http://userscripts.org/users/
// @include     http://targate.fr/index.php?choix=centre_espionnage*
// @include     http://www.targate.fr/index.php?choix=centre_espionnage*
// @include     https://targate.fr/index.php?choix=centre_espionnage*
// @version     1.2.4.2
// @require 	http://code.jquery.com/jquery-2.1.4.min.js
// @require 	http://git.degree.by/degree/userscripts/raw/bb45d5acd1e5ad68d254a2dbbea796835533c344/src/gm-super-value.user.js
// @grant       GM_log
// @grant 		GM_setValue
// @grant 		GM_getValue
// ==/UserScript==
WP_DEBUG = true;
var myPseudo = null;
var myPoints = null;

/***** CHANGELOG *****\
 - 1.2.4		: Correction des bugs induits par la factorisation. Correction des couleurs.
 - 1.2.3		: 
 	+ Optimisations majeures.
 	+ Factorisation du code.
 	+ Lisibilité du code.
 	+ Couleurs en dégradé pour les joueurs.
 - 1.2.2.4		: Affichage du nombre de VAB nécessaires pour piller les ressources du joueur (en prenant en compte les 10% du commandeur).
 - 1.2.2		: Ajout de la couleur rouge sur le lien pour les notes quand cette dernière n'est pas vide.
 - 1.2.1		: Ajout d'un bouton pour accéder à la fonctionnalité des notes.
 - 1.2			: Ajout de la fonctionnalité d'ajout/consultation des notes pour les joueurs du centre d'espionnage.
 - 1.1.2.6		: Ajustements.
 - 1.1.2		: Correction des events handlers sur les boutons bleus.
 - 1.1.1.3		: Complétion et correction de valeurs dans les tableaux des entrepôts.
 - 1.1.1.1		: Problème dans la détection des alliances corrigé.
 - 1.1.1		: Détection des alliances.
 - 1.1			: Réorganisation du tableau de joueurs.
\*********************/

/***** BUGS *****\
 - Le calcul des couleurs ne marche pas si on est premier (division par 0).
\****************/

/***** TODO *****\
 + ESPIONNAGE :
 	- Afficher les points des joueurs en vert dégradé orange si attaquables, puis rouge quand points trop élevés ou trop faibles.
 	- Option ASC/DESC pour le classement des joueurs.
 	- Régler les ressources des entrepôts.
 + SIMULATION
 	- Afficher le résultat de la simulation de combat dans la page, si demandé par l'utilisateur (spatial ou terrestre).
 + TECHNIQUE :
 	- Réarchitecturer le module d'espionnage.
 + NOTES :
 	- Bouton permettant d'effacer toutes les notes.
 	- La textarea des notes est mal dimensionnée.
\****************/


var getTextNodesIn = function(el) {
    return $(el).find(":not(iframe)").addBack().contents().filter(function() {
        return this.nodeType == 3;
    });
};

//TODO: Vérifier la valeur pour un entrepôt niveau 3 (ce ne doit pas etre 540k je pense)
var maxRes = [100000, 170000, 380000, 540000, 1290000, 2340000, 4860000, 8430000, 14450000, 24250000, 40420000, 66670000, 109020000, 177200000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
//TODO: Récupérer les valeurs manquantes
var maxTrit = [100000, 0, 0, 0, 1430000, 2340000, 4510000, 7660000, 12980000, 21520000, 35380000, 0, 92850000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var Network = {
	GetAllPlayers : function(callback, error) {
	    // Requête sur la page des bâtiments.
	    var xhr = new XMLHttpRequest();
	    var self = this;

	    // Configuration de la requête vers la page de classements.
	    xhr.open("GET", "http://targate.fr/index.php?choix=classement", true);
	    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	    xhr.setRequestHeader("Accep-Encoding", "gzip,deflate,sdch");
	    xhr.setRequestHeader("Accept-Language", "fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4");
	    //xhr.setRequestHeader("Content-Length", 12); // UNSAFE HEADER

	    xhr.onreadystatechange = function() {
	        if (xhr.readyState == 4) {
	            // Récupération de la page de classement.
	            var responseText = xhr.responseText;
	    		var bodyStr = responseText.substring(responseText.indexOf("<body>") + 6, responseText.indexOf("</html>") - 15);
			    var body = document.createElement('div');
			    body.innerHTML = bodyStr;

				// Récupération des joueurs et de leurs points.
				var players = [];
				$(body).find(".colorwhite > center > table > tbody > tr:not([height])").each(function() {
					var $this = $(this);
					var player = {
						name : $this.find("a:eq(0)").text(), 
						points: $this.children("[class]").text(),
						isMyself: ($this.attr("style") === "color:red;")
					};
					if (player.isMyself) 
						myPseudo = player.points;
					players.push(player);
				});

		        // Appel du callback de bâtiment trouvé.
		        if(callback!==null) callback(players);
		        if(self.ongetallplayers!==null) self.ongetallplayers(players);
	        }
	    }; 
	    xhr.send();//params); 
	},
	ongetallplayers : null
};

var UI = {
	_sortPlayers : function(players) {
		// Tri des joueurs dans l'interface en fonction des tags "playerName" et "playerPoints" des TR.
		var $table = $("div.espionListe > fieldset.espionColonne2Liste > table");
		var $tBody = $table.find("tbody");
		var tabPts = [];
		var $tTr = $tBody.children();
		var fini = false;
		var tmpTabPts;

		for(var i = 0; i < $tTr.length / 2; ++i){
			var attr = $tTr[i*2].getAttribute('data-playerpoints');
			var points = 0;
			if(attr !== null) points = parseInt(attr);
			var playerTr = {
				trs 	: [$tTr.eq(i * 2), $tTr.eq(i * 2 + 1)],
				pts 	: points
			};
			tabPts.push(playerTr);
		}

		// Tri à bulle des joueurs (DESC).
		while (!fini) {
			fini = true;
			//prevPts = 0;
			for(var j=1; j<tabPts.length; j++) {
				if(tabPts[j].pts > tabPts[j-1].pts) {
					tmpTabPts = tabPts[j];
					tabPts[j] = tabPts[j-1];
					tabPts[j-1] = tmpTabPts;
					fini = false;
				}
			}
		}

		// Réorganisation du tableau des joueurs dans l'ordre.
		var trAppend = [];
		for(var i=0;i<tabPts.length;++i) {
			if(tabPts[i].pts > 0) {
				trAppend.push(tabPts[i].trs[0]);
				trAppend.push(tabPts[i].trs[1]);
			}
		}
		
		$table.prepend(trAppend);
	},
	DrawPoints : function() {
		var self=this;
		// Ajout des points des joueurs.
		Network.GetAllPlayers(function(players) {
			var maxPts = null;
			var minPts = null;
			var maxSpan = null;

			// Récuépration des points des joueurs sous forme de nombre.
			// Récupération des points du joueur utilisant le script.
			for (var i=0; i<players.length; ++i) {
				players[i].intPoints = parseInt(((players[i].points.length <= 0)?"0":players[i].points.replace(/\./g, "")));
				if (players[i].isMyself) myPoints = players[i].intPoints;

				if (maxPts === null || maxPts < players[i].intPoints) maxPts = players[i].intPoints;
				if (minPts === null || minPts > players[i].intPoints) minPts = players[i].intPoints;
			}

			maxSpan = maxPts - myPoints;
			$("div.espionListe > fieldset.espionColonne2Liste > table > tbody > tr:not([id]) > td > div").each(function() {
				for (var i=0; i<players.length; ++i) {
					if (players[i].processed === undefined) {
						var elPlayerName = $(this).text();
						var iParentese = elPlayerName.indexOf("(") - 1;
						var elPlayerNameNoAlliance = 
						elPlayerName.substr(
							0, (iParentese<=0)?(elPlayerName.length):(iParentese - 1)
						);

						if(players[i].name==elPlayerNameNoAlliance) {
							var r, g, b;
							var pct;
							if (players[i].intPoints > myPoints) {
								pct = myPoints / players[i].intPoints;
								r = parseInt(50 + (pct * 205));
								g = parseInt(255 - (pct * 255));
								b = 0;
							} else if(players[i].intPoints <= myPoints) {
								pct = 1 - ((players[i].intPoints - myPoints) / maxSpan);
								r = parseInt(255 - (pct * 205));
								g = (50 + (pct * 205));
								b = 0;
							}
							this.innerHTML = 
								"|&nbsp;" + 
									players[i].points + 
								"&nbsp;|&nbsp;" + 
								"<span style='color:rgb(" + r + "," + g + "," + b + ");'>" + 
									this.innerHTML + 
								"</span>";
							$(this).parents("tr")[0].setAttribute('data-playername', players[i].name);
							$(this).parents("tr")[0].setAttribute('data-playerpoints', ((players[i].points.length <= 0)?"0":players[i].points.replace(/\./g, "")));
							players[i].processed = true;
							i = players.length + 100;
						} 
					}
				}
				if(i<players.length+50) 
					this.innerHTML = 
						"|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;" + 
							"<span>" + 
								this.innerHTML + 
							"</span>";
			});
			self._sortPlayers(players);
		});
	}
};

var Espionnage = {
	_demiResPour : function(level, bPourTritium) {
		if (bPourTritium) return maxTrit[level] / 2; 
		else return maxRes[level] / 2;
	},
	_pillagePour : function(playerResources, level, bPourTritium) {
		var pill = playerResources - this._demiResPour(level, bPourTritium);
		if (pill < 0) pill = 0;
		return pill;
	},
	_valeurCle : function(txtObj) {
		var txt = txtObj.textContent;
		return parseInt(txt.substr(txt.indexOf(":")+1, txt.length).replace(/\./g, ''));
	},
	_initPanel : function() {
		var self = this;

		// Initialisation des améliorations du panneau de droite.
	    var rapportRsrc = $("fieldset.espionMoyenrapport:nth-child(2) > div:nth-child(3)");
	    var rapportBats = $("fieldset.espionGrandrapport").first();
	    $(".espionnageColonne1").prepend("<div class='tttespace' style='float:left;width=200px;' />");
	    $(".tttespace").width(100);
	    $(".tttespace").height(window.scrollY - 50);
	    $(window).scroll(function() {
	        $(".tttespace").width(100);
	        $(".tttespace").height(window.scrollY - 50);
	    });

		$(".boutonBleu").click(function() {
			setTimeout(self._initPanel, 700);
		});

	    if (rapportRsrc.length>0 && rapportBats.length>0) {
	        var txtRsrc = getTextNodesIn(rapportRsrc);
	        var txtBats = getTextNodesIn(rapportBats);

	        if (txtRsrc.length === 4 && txtBats.length === 22) {
	        	var nivOr = this._valeurCle(txtBats[14]);
	        	var nivTi = this._valeurCle(txtBats[15]);
	        	var nivTr = this._valeurCle(txtBats[16]);
	        	var nivNo = this._valeurCle(txtBats[17]);
	            var or = this._valeurCle(txtRsrc[0]);
	            var titane = this._valeurCle(txtRsrc[1]);
	            var tritium = this._valeurCle(txtRsrc[2]);
	            var nourriture = this._valeurCle(txtRsrc[3]);

	            var pillOr = this._pillagePour(or, nivOr, false);
	            var pillTit = this._pillagePour(titane, nivTi, false);
	            var pillNour = this._pillagePour(nourriture, nivNo, false);
	            var pillTrit = this._pillagePour(tritium, nivTr, true);
	            var pillTot = pillOr + pillTit + pillTrit + pillNour;

	            var nbCarg = Math.ceil(pillTot / 40000);
	            var nbRavi = Math.ceil(pillTot / 20000);
	            var nbVAB = Math.ceil(pillTot / (3000 + 300)); // +300 pour simuler les 10% qu'ajoute le commandeur.

	            var app = 	
	            	"<br/>" + 
	            	"<div style='color:red;'>" +
	                	"Pillage : "  + pillTot + "<br/>" + 
	                	"VAB" + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + ": " + nbVAB + "<br/>" +
	                	"Ravitailleurs" + "&nbsp;" + ": " + nbRavi + "<br/>" +
	                	"Cargos" + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + ": " + nbCarg + "<br/>" + 
	                "</div>";
	            rapportRsrc.append(app);
	        }
	    }
	},
	Init : function(){
		var self=this;
		// Ajout de la gestion du clic.
		$(".coloraqua").click(function() {
		    setTimeout(function() {
		    	self._initPanel();
		    }, 700);
		});
	}
};

// Module de gestion des notes sur les joueurs.
var Notes = {
	InputEl : $("<div id='tttdivinput' class='ttthidden'>" +
					"<textarea id='tttnoteinput'></textarea>" +
					"<button id='tttnoteok'>OK</button>" +
				"</div>"),
	EditingPlayerName : "",
	$EditingPlayerTd : null,
	InsertCss : function() {
		var css =
			"#tttdivinput {" +
				"height: 4cm;" +
				"width: 4cm;" +
				"border: 1mm solid black;" +
				"border-radius: 1mm;" +
				"background-color: black;" +
				"position: absolute;" +
			"}" +
			"#tttnoteinput {" +
				"width: 100%;" +
			"}" +
			".ttthidden {" +
				"display:none;" +
			"}" + 
			".tttinline {" +
				"display:inline;" +
			"}" +
			".tttshownote {" +
				"color: cyan;" +
			"}" +
			".tttnotepresente {" +
				"color: red;" +
			"}";

		$("body").prepend("<style>" + css + "</style>");
	},
	InsertNoteButtons: function() {
		var self = this;

		$("div.espionListe > fieldset.espionColonne2Liste > table > tbody > tr:not([id]) > td").prepend("<a class='tttshownote'>[*]&nbsp;</a>");

		// On affiche les divs contenant le nom des joueurs en inline, sinon ils apparaissent à la ligne après le bouton.
		$("div.espionListe > fieldset.espionColonne2Liste > table > tbody > tr:not([id]) > td > div").addClass('tttinline');
	},
	SaveNote : function(playerName, noteContent) {
		GM_SuperValue.set("note:" + playerName, noteContent); 
	},
	GetNote : function(playerName) {
		var value = GM_SuperValue.get("note:" + playerName);
		return (value!==undefined) ? value : '';
	},
	AddEventsHandler : function() {
		var self = this;
		// gestion d'un clic sur le lien d'affichage de la note pour un utilisateur.
		$("div.espionListe > fieldset.espionColonne2Liste > table > tbody > tr:not([id]) > td > a.tttshownote").click(
			function(e) {
				self.EditingPlayerName = $(this).parents("tr").attr("data-playername");
				self.$EditingPlayerTd = $(this).parents("td");
				self.InputEl.css("top", e.pageY+5);
				self.InputEl.css("left", e.pageX+5);
				self.InputEl.removeClass("ttthidden");
				var txtInput = self.InputEl.children()[0];
				txtInput.value = self.GetNote(self.EditingPlayerName);
				e.preventDefault();
				return false;
			}
		);

		// Gestion d'un clic sur le bouton de validation de la note.
		self.InputEl.children().last().click(function(e) {
			var elA = self.$EditingPlayerTd.children("a");
			self.InputEl.addClass("ttthidden");
			if(self.EditingPlayerName.length > 0) {
				var note = self.InputEl.children().first()[0].value;
				self.SaveNote(self.EditingPlayerName, note);
				if (note !== '') elA.addClass("tttnotepresente");
				else elA.removeClass("tttnotepresente");
			} 
			self.EditingPlayerName = "";
			self.$EditingPlayerTd = null;
		});
	},
	Init : function() {
        var self=this;

		// En espérant que les noms de joueurs soient chargés à ce moment.
		Network.ongetallplayers = function() {
	        self.InsertCss();
	        self.InsertNoteButtons();
			$("body").prepend(self.InputEl);
			self.AddEventsHandler();
			$("div.espionListe > fieldset.espionColonne2Liste > table > tbody > tr:not([id]) > td > a").each(function() {
				if(self.GetNote($(this).parents("tr").attr("data-playername")) !== '') $(this).addClass("tttnotepresente");
			});
		};
	}
};


UI.DrawPoints();
Espionnage.Init();
Notes.Init();