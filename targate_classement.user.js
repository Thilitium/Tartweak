// ==UserScript==
// @name        Targate-Classement
// @namespace   http://userscripts.org/users/
// @include 	http://targate.fr/index.php?choix=classement*
// @include     http://www.targate.fr/index.php?choix=classement*
// @include     https://targate.fr/index.php?choix=classement*
// @version     0.0.2.11
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

// Todo

// Bugs

// Changelog
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
			if (player.isMyself) myPseudo = player.name;
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
			var logPoints = GM_SuperValue.get("score:" + players[i].name);
			if(logPoints===undefined) logPoints = {};
			if(logPoints["Invalid date"]!==undefined) {
				delete logPoints["Invalid date"];
				GM_SuperValue.set("score:" + players[i].name, logPoints);
			}
			if(logPoints[curDate]===undefined) {
				logPoints[curDate] = players[i].intPoints;
				GM_SuperValue.set("score:" + players[i].name, logPoints);
			}
		}

		if(callback!==undefined) callback(players);
	}
};

var UI = {
	_chartOptions : null,
	_sizing: false,
	CreerChart : function(container, players) {
		var self = this;
		var $container = $(container);
		var data = [];
		for(var i=0; i<players.length; ++i) {
			var score = GM_SuperValue.get("score:" + players[i].name);
			var tScore = [];
			for(var dateScore in score) tScore.push({x: new Date(dateScore), y: score[dateScore]});
			data.push({
				//showInLegend: true,
				name 		: players[i].name,
				type		: "spline",
				dataPoints	: tScore
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
		/*$container.resize(function() { 
				self._chartOptions.animationEnabled = false;
				++self._sizing;
				setTimeout(function() {
					--self._sizing;
					if(self._sizing==0)
						$(this).CanvasJSChart(self._chartOptions); 
						
				}, 1000);
		});*/

	}
};


var $body = $("body");

// Récupération des joueurs et de leurs points.
var players = [];
var divMaster = $("<div class='tttdivgraph' style='position:absolute;height:300px;width:500px;z-index:999;'/>")
var divContain = $("<div/>");

//divMaster.append(divContain);
$body.prepend(divMaster);

divMaster.draggable();
divMaster.resizable();

Data.GetAllPlayers(
	function(players) { 
		Metier.StoreScores(players, 
			function(players) {
				UI.CreerChart(divMaster, players);
			}
		);
	}
);