// ==UserScript==
// @name        Targate-Classement
// @namespace   http://userscripts.org/users/
// @include 	http://targate.fr/index.php?choix=classement*
// @include     http://www.targate.fr/index.php?choix=classement*
// @include     https://targate.fr/index.php?choix=classement*
// @version     0.0.0.1
// @require 	http://code.jquery.com/jquery-2.1.4.min.js
// @require 	http://git.degree.by/degree/userscripts/raw/bb45d5acd1e5ad68d254a2dbbea796835533c344/src/gm-super-value.user.js
// @require		https://raw.githubusercontent.com/nnnick/Chart.js/master/Chart.min.js
// @require		http://momentjs.com/downloads/moment.js
// @grant       GM_log
// @grant 		GM_setValue
// @grant 		GM_getValue
// ==/UserScript==
WP_DEBUG = true;
var myPseudo = null;
var myPoints = null;

// Todo

// Bugs

// Changelog


var Data = {
	GetAllPlayers : function(callback) {
		var players = [];
		$(body).find(".colorwhite > center > table > tbody > tr:not([height])").each(function() {
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
}

var Metier = {
	StoreScores : function(players, callback) {
		var curDate = moment('YYYYMMDD');
		var keyNote;

		for(var i=0; i<players.length; ++i) {
			var logPoints = GM_SuperValue.get("score:" + players[i].name);
			if(logPoints===undefined) logPoints = {};
			if(logPoints[curDate]===undefined) {
				logPoints[curDate] = players[i].intPoints;
				GM_SuperValue.set("score:" + players[i].name, logPoints);
			}
		}

		if(callback!==undefined) callback(players);
	}
}

var UI = {
	CreerChart : function(container, players) {
		var data = [];
		for(var i=0; i<players.length; ++i) {
			var score = GM_SuperValue.get("score:" + players[i].name);
			var tScore = [];
			for(var dateScore in score) tScore.push({x: dateScore, y: score[dateScore]});
			data.push({
				showInLegend: false,
				name 		: players[i].name,
				type		: "spline",
				dataPoints	: tScore
			})
			data.push()
		};

		var options = {
			title				: {text: "Points des joueurs en fonction du temps : "},
			animationEnabled	: true,
			data 				: data
		}

		$(container).CanvasJSChart(options);
	}
}

// Récupération des joueurs et de leurs points.
var players = [];
var self = this;
var divContain = $("<div/>");
$("body").prepend(divContain);
self.Data.GetAllPlayers(
	function(players) { 
		self.Metier.StoreScores(players, 
			function(players) {
				self.CreerChart(self.divContain, players);
			}
		);
	}
);