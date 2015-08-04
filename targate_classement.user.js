// ==UserScript==
// @name        Targate-Classement
// @namespace   http://userscripts.org/users/
// @include 	http://targate.fr/index.php?choix=classement*
// @include     http://www.targate.fr/index.php?choix=classement*
// @include     https://targate.fr/index.php?choix=classement*
// @version     1.1.0.1
// @require 	http://code.jquery.com/jquery-2.1.4.min.js
// @require 	http://git.degree.by/degree/userscripts/raw/bb45d5acd1e5ad68d254a2dbbea796835533c344/src/gm-super-value.user.js
// @require		https://raw.githubusercontent.com/nnnick/Chart.js/master/Chart.min.js
// @require		https://raw.githubusercontent.com/Thilitium/Tartweak/master/jquery.canvasjs.min.js
// @require		http://code.jquery.com/ui/1.11.4/jquery-ui.js
// @grant       GM_log
// @grant 		GM_setValue
// @grant 		GM_getValue
// ==/UserScript==
// Inclusion du CSS jQueryUI
$("body").prepend('<link rel="stylesheet" href="http://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.css">');


WP_DEBUG = true;
var myPseudo = null;
var myPoints = null;
var keyScore = "";

/* Todo
 - Implémentation du graphique pour tous les types de score.
*/
// Bugs

// Changelog
// 1.1.0.0		: Ajout du filtre sur les joueurs dans la tranche attaquable à partir d'un clic sur série.
// 1.0.0.0		: Plug-in fonctionnel pour les scores de type "général" uniquement.
// 0.0.2.0		: Fenêtre déplaçable / redimensionnable.
// 0.0.1.2		: Débogage du code de récupération des données.

var Data = {
	GetAllPlayers : function(callback) {
		var players = [];
		$("body").find(".colorwhite > center > table > tbody > tr:not([height])").each(function() {
			var $this = $(this);
			var txtPoints = $this.children("[class]").text();
			var player = {
				name 			: $this.find("a:eq(0)").text(), 
				points 			: txtPoints,
				intPoints 		: parseInt(((txtPoints.length <= 0)?"0":txtPoints.replace(/\./g, ""))),
				isMyself		: ($this.attr("style") === "color:red;")
			};
			if (player.isMyself) {
				myPseudo = player.name;
				myPoints = player.intPoints;
			}
			players.push(player);
		});
		if(callback !== undefined) callback(players);
	}
};

var Metier = {
	StoreScores : function(players, callback) {
		var curDate = new Date();
		curDate.setHours(0,0,0,0);
		var keyNote;

		for(var i=0; i<players.length; ++i) {
			var logPoints = GM_SuperValue.get(keyScore + players[i].name);
			if(logPoints===undefined) logPoints = {};
			if(logPoints["Invalid date"]!==undefined) {
				delete logPoints["Invalid date"];
				GM_SuperValue.set(keyScore + players[i].name, logPoints);
			}
			if(logPoints[curDate]===undefined) {
				logPoints[curDate] = players[i].intPoints;
				GM_SuperValue.set(keyScore + players[i].name, logPoints);
			}
		}

		if(callback!==undefined) callback(players);
	}
};

var UI = {
	_chart 				: null,
	_chartOptions 		: null,
	_sizing 			: 0,
	_showAllPlayers 	: true,
	_toggleMinMaxUsers 	: function() {
		var self = this;
		var min, max;
		if(self._chart===null) return false;
		self._showAllPlayers = !_self._showAllPlayers;
		for(var i=0; i<self._chart.options.data.length; ++i) {
			if(self._showAllPlayers) {
				self._chart.options.data[i].visible = true;
			} else {
				min = self._chart.options.data[i].minY;
				max = self._chart.options.data[i].maxY;

				if (min<myPoints && max>myPoints)
					self._chart.options.data[i].visible = true;
				else if(min<myPoints && max<myPoints)
					self._chart.options.data[i].visible = ((max / myPoints) > 0.5);
				else if(min>myPoints && max>myPoints)
					self._chart.options.data[i].visible = ((myPoints/max) > 0.5);
			}
		}
	},
	CreerChart  		: function(container, players) {
		var self = this;
		var $container = $(container);
		var data = [];
		for(var i=0; i<players.length; ++i) {
			var score = GM_SuperValue.get(keyScore + players[i].name);
			var tScore = [];
			var min = 9999999999; var max=0;
			for(var dateScore in score) {
				if(min>score[dateScore]) min=score[dateScore];
				if(max<score[dateScore]) max=score[dateScore];
				tScore.push({x: new Date(dateScore), y: score[dateScore]});
			}
			data.push({
				//showInLegend: true,
				name 		: players[i].name,
				type		: "spline",
				dataPoints	: tScore,
				visible		: true,
				minY		: min,
				maxY		: max,
				click		: function() { self._toggleMinMaxUsers(); }
			});
		}

		self._chartOptions = {
			title				: {text: "Points des joueurs en fonction du temps : "},
			toolTip				: {content: "{x} <br/> {name}: {y}"},
			axisX				: {valueFormatString: "DD/MM/YY"},
			axisY				: {includeZero: false}, 
			animationEnabled	: true,
			data 				: data,
			height				: 300,
			width				: 500
		};

		$container.CanvasJSChart(self._chartOptions);
		self._chart = $container.CanvasJSChart();
	}
};


var $body = $("body");

// Récupération des joueurs et de leurs points.
var players = [];
var divMaster = $("<div class='tttdivgraph' style='position:absolute;height:300px;width:500px;z-index:999;'/>");
var divContain = $("<div style='height:100%;width:100%;' />");

var Init = function() {

	// On vérifie sur quelle page de classement on se trouve
	var menu = $("#menuplanete5").val();
	if (menu==='general') {
		keyScore="score:";
		divMaster.append(divContain);
		$body.prepend(divMaster);

		divMaster.draggable();
		divMaster.resizable({
			delay: 150,
			stop: function(event, ui) {
				chart = divContain.CanvasJSChart();
				chart.options.width = divContain.width();
				chart.options.height = divContain.height();
				chart.render();
			}
		});

		Data.GetAllPlayers(
			function(players) { 
				Metier.StoreScores(players, 
					function(players) {
						UI.CreerChart(divContain, players);
					}
				);
			}
		);
	}
};

Init();
