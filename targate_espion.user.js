// ==UserScript==
// @name        Targate-Espionnage
// @namespace   http://userscripts.org/users/
// @include     http://targate.fr/index.php?choix=centre_espionnage*
// @include     http://www.targate.fr/index.php?choix=centre_espionnage*
// @include     https://targate.fr/index.php?choix=centre_espionnage*
// @version     1.0.2.4
// @require 	http://code.jquery.com/jquery-2.1.4.min.js
// @grant       GM_log
// ==/UserScript==
WP_DEBUG = true;


var getTextNodesIn = function(el) {
    return $(el).find(":not(iframe)").addBack().contents().filter(function() {
        return this.nodeType == 3;
    });
};

//TODO: Vérifier la valeur pour un entrepôt niveau 3 (ce ne doit pas etre 540k je pense)
var maxRes = [100000, 170000, 380000, 540000, 1290000, 2340000, 4860000, 8430000, 14450000, 24250000, 40420000, 66670000, 109020000, 177200000];
//TODO: Récupérer les valeurs manquantes
var maxTrit = [100000, 0, 0, 0, 1290000, 2340000, 3950000, 0, 11020000, 17950000, 25800000];

var demiResPour = function(level, tritium) {
	if(tritium) 
		return maxTrit[level]/2; 
	else 
		return maxRes[level]/2;
};
var pillPour = function(rsrc, level, tritium) {
	var pill = rsrc - demiResPour(level, tritium);
	if(pill<0) pill = 0;
	return pill;
};
var valeurCle = function(txtObj) {
	var txt = txtObj.textContent;
	return parseInt(txt.substr(txt.indexOf(":")+1, txt.length).replace(/\./g, ''));
};

var GetAllPlayers = function(callback, error) {
    // Requête sur la page des bâtiments.
    var xhr = new XMLHttpRequest();
    //var params = "planete="+codeP;	// Code de la planète de provenance. Nécessaire dans le form.
    
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
				var player = {
					name : $(this).find("a:eq(0)").text(), 
					points: $(this).children("[class]").text()
				};
				players.push(player);
			});
	        // Appel du callback de bâtiment trouvé.
	        if(callback!==null) callback(players);
        }
    }; 
    xhr.send();//params); 
};

// Tri des joueurs dans l'interface en fonction des tags "playerName" et "playerPoints" des TR.
var sortPlayers = function(table, players) {
	var $tBody = $(table).find("tbody");
	var tTr = $tBody.children();
	var tabPts = [];
	var fini = false;
	var tmpTabPts;


	for(var i=0;i<tTr.length/2;++i){
		var attr = tTr[i*2].getAttribute('data-playerpoints');
		var points = 0;
		if(attr !== null) points = parseInt(attr);
		var playerTr = {
			trs 	: [$(tTr[i * 2]), $(tTr[i * 2 + 1])],
			pts 	: points
		};
		tabPts.push(playerTr);
	}

	// Tri à bulle des joueurs (DESC).
	while(!fini) {
		fini = true;
		//prevPts = 0;
		for(var j=1;j<tabPts.length;j++) {
			if(tabPts[j].pts > tabPts[j-1].pts) {
				tmpTabPts = tabPts[j];
				tabPts[j] = tabPts[j-1];
				tabPts[j-1] = tmpTabPts;
				fini = false;
			}
		}
	}

	//-------------------------------
	queue = {
	    _timer: null,
	    _queue: [],
	    add: function(fn, context, time) {
	        var setTimer = function(time) {
	            queue._timer = setTimeout(function() {
	                time = queue.add();
	                if (queue._queue.length) {
	                    setTimer(time);
	                }
	            }, time || 2);
	        }

	        if (fn) {
	            queue._queue.push([fn, context, time]);
	            if (queue._queue.length == 1) {
	                setTimer(time);
	            }
	            return;
	        }

	        var next = queue._queue.shift();
	        if (!next) {
	            return 0;
	        }
	        next[0].call(next[1] || window);
	        return next[2];
	    },
	    clear: function() {
	        clearTimeout(queue._timer);
	        queue._queue = [];
	    }
	};
	//-------------------------------

	// Réorganisation du tableau des joueurs dans l'ordre.
	for(var i=0;i<tabPts.length;++i) {
		if(tabPts[i].pts > 0){
			var func = function() { $tBody.prepend(tabPts[i].trs); };
			queue.add(func, this);
		}
	}
};

// Ajout des points des joueurs
GetAllPlayers(function(players) {
	$("div.espionListe > fieldset.espionColonne2Liste > table > tbody > tr:not([id]) > td > div").each(function() {
		var i;
		for (i=0; i<players.length; ++i) {
			if(players[i].name==$(this).text()) {
				this.innerHTML = "|&nbsp;" + players[i].points + "&nbsp;|&nbsp;" + this.innerHTML;
				$(this).parents("tr")[0].setAttribute('data-playername', players[i].name);
				$(this).parents("tr")[0].setAttribute('data-playerpoints', ((players[i].points.length <= 0)?"0":players[i].points.replace(/\./g, "")));
				i = players.length + 100;
			} 
		}
		if(i<players.length+50) this.innerHTML = "|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;" + this.innerHTML;
	});
	sortPlayers($("div.espionListe > fieldset.espionColonne2Liste > table"), players);
});



// Ajout de la gestion du clic.
$(".coloraqua").add(".boutonBleu").click(function() {

    setTimeout(function() {
        
        var rapportRsrc = $("fieldset.espionMoyenrapport:nth-child(2) > div:nth-child(3)");
        var rapportBats = $("fieldset.espionGrandrapport").first();
        $(".espionnageColonne1").prepend("<div class='tttespace' style='float:left;width=200px;' />");
        $(".tttespace").width(100);
        $(".tttespace").height(window.scrollY - 50);
        $(window).scroll(function() {
            $(".tttespace").width(100);
            $(".tttespace").height(window.scrollY - 50);
        });

        if (rapportRsrc.length>0 && rapportBats.length>0) {
            var txtRsrc = getTextNodesIn(rapportRsrc);
            var txtBats = getTextNodesIn(rapportBats);

            if (txtRsrc.length === 4 && txtBats.length === 22) {
            	var nivOr = valeurCle(txtBats[14]);
            	var nivTi = valeurCle(txtBats[15]);
            	var nivTr = valeurCle(txtBats[16]);
            	var nivNo = valeurCle(txtBats[17]);
                var or = valeurCle(txtRsrc[0]);
                var titane = valeurCle(txtRsrc[1]);
                var tritium = valeurCle(txtRsrc[2]);
                var nourriture = valeurCle(txtRsrc[3]);

                var pillOr = pillPour(or, nivOr, false);
                var pillTit = pillPour(titane, nivTi, false);
                var pillNour = pillPour(nourriture, nivNo, false);
                var pillTrit = pillPour(tritium, nivTr, true);
                var pillTot = pillOr + pillTit + pillTrit + pillNour;

                var nbCarg = Math.ceil(pillTot / 40000);
                var nbRavi = Math.ceil(pillTot / 20000);

                var app = 	"<br/>" + "<div style='color:red;'>" +
                    "Pillage : "  + pillTot + "<br/>" + 
                    "Ravitailleurs&nbsp;: " + nbRavi + "<br/>" +
                    "Cargos&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: " + nbCarg + "<br/>" + "</div>";
                rapportRsrc.append(app);
            }
        }
    }, 1250);
});
