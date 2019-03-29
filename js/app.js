//INITIALISATION DE L'ETAT DE L'INVENTAIRE (joueur.inventaire()) à 0 (fermé).
var stateInventaire = 0;

//INITIALISATION DE L'ACTION EN COURS DE REALISATION. AU DEBUT, AUCUNE. L'ACTION EST DECLENCHE PAR LE CLIC SUR UN OBJET DE l'INVENTAIRE ACTIONNABLE (ECOUTEUR DANS joueur.inventaure() ET EXECUTION dans joueur.actionInventaire())
var actionInProgress = null;

//INITIALISATION DU TABLEAU CONTENANT LA LISTE DES OBJETS PRESENTS SUR LA MAP (Objet item et ses prototype)/
var listItems = [];
var pokedex = [];
var pokemons = [];

//DEFINITION DE L'OBJET ZONE DE JEU, IL CONTIENT LES DIMENSION DE l'AIRE DE JEU ET SON DESIGN. ON UTILISE JQUERY POUR LE STYLER DYNAMIQUEMENT.
var zoneJeu = {
	id: 'zoneJeu',
	styleCss: 'clZoneJeu',
	width: 400,
	height: 370,
	bg: 'assets/img/bg.png',
	init: function() { //AFFICHAGE HTML
		$('body').append('<div id="' + this.id + '" class="' + this.styleCss + '"></div>');
		$('#' + this.id).css('width', this.width + 'px')
			.css('height', this.height + 'px')
			.css('background', 'url("' + this.bg + '") repeat center center');
		$('#musicExploration')[0].play();
	},
	displayMessage: function(message) {
		$('#' + this.id).append('<div id="messageBox">' + message + '</div>');
	},
	removeMessage: function() {
		$('#messageBox').remove();
	}
}

//INITIALISATION DE L'OBJET JOUEUR
var joueur = {
	id: 'joueur', //ID POUR MANIPULATION VIA LE DOM
	styleCss: 'clJoueur', //CLASSE CSS POUR LES STYLE FIXES (EX : LA POSITION ABSOLUTE)
	width: 25,
	height: 25,
	vitesseDeplacement: 10, //PAS EN PIXEL, PERMETTANT DE GERER SA VITESSE DE DEPLACEMENT. UTILE POUR l'AUGMENTER ET LA REDUIRE (BICYCLETTE)
	posX: 20, //POSITION INITIALE
	posY: 50,
	bgLeft: 'assets/img/player/left.png', //SKIN INITIAL POUR LES DIFFERENTES POSITIONS, UTILE POUR LE MODIFER EN COURS DE JEU (POUR LA BICYCLETTE PAR EXEMPLE)
	bgRight: 'assets/img/player/right.png',
	bgTop: 'assets/img/player/top.png',
	bgBottom: 'assets/img/player/bottom.png',
	contenuInventaire: { //CONTENU DE L'INVENTAIRE, ON FAIT UN TABLEAU ASSOCIATIF POUR POUVOIR LE PARCOURIR FACILEMENT, IL CONTIENT UN NOM D'ITEM ET UNE QUANTITE. LE NOM NOUS SERVIRA POUR ASSOCIER UN ID LORS DE L'AFFICHAGE DE L'INVENTAIRE (joueur.inventaire()) ET L'ASSOCIATION D'UNE ACTION A L'ITEM PARCOURU LORS D'UN CLIC (joueur.actionInventaire())
		'Bicyclette': 1,
		'Pokeballs': 10
	},
	init: function() { //AFFICHAGE HTML DU JOUEUR
		$('#' + zoneJeu.id).append('<div id="' + this.id + '" class="' + this.styleCss + '"></div>');
		$('#' + this.id).css('width', this.width + 'px')
			.css('height', this.height + 'px')
			.css('top', this.posY + 'px')
			.css('left', this.posX + 'px')
			.css('background', 'url("' + this.bgTop + '") no-repeat center center')
			.css('background-size', 'auto 100%');
	},
	deplace: function(e) { //METHODE DE DEPLACEMENT (LANCE VIA UN ECOUTEUR SUR LES INPUT CLAVIER EN BAS DE FICHIER)
		//VERIFICATION DES LIMITES
		zoneJeu.removeMessage();
		this.maxX = zoneJeu.width - this.width; //LA LIMITE DE LA ZONE DE JEU EST EGALE A LA LARGEUR DE LA ZONE DE JEU - LA LARGEUR DU JOUEUR (PUISQUE ON PART DE LEFT)
		this.maxY = zoneJeu.height - this.height; //IDEM MAIS POUR LES HAUTEURS

		//ENREGISTREMENT DES COORDONNEES AVANT LE DEPLACEMENT, UTILE SI L'ON DOIT ANNULER LE DEPLACEMENT (LORS D'UNE COLLISION PAR EXEMPLES)
		var oldPosX = this.posX;
		var oldPosY = this.posY;

		//TEST DES DIRECTIONS
		if (e.which == 39) {
			//DROITE
			var toModif = 'left';
			var newPos = this.posX + this.vitesseDeplacement; //LA NOUVELLE POSITION EST EGALE A L'ANCIENNE POSITION + OU - LA VITESSE DE DEPLACEMENT
			if (newPos > this.maxX) //ON VERIFIE QUE LE DEPLACEMENT NE NOUS EMMENERA PAS EN DEHORS DES LIMITES
				this.posX = this.maxX; //SI OUI, ON PLACE LE JOUEUR AU BORD DE L'ECRAN, MAIS PAS AU DELA
			else
				this.posX = newPos; //SI NON, ON EXECUTE LE DEPLACEMENT DEMANDE

			//ON INITIALISE LA VARIABLE PERMETTANT DE SAVOIR S'IL Y A UNE COLLISION
			var collision = false;
			//ON PARCOURT LE TABLEAU CONTENANT TOUS LES OBJETS (INITIALISE EN DEBUT DE FICHIER ET COMPLETE DANS item.init())
			for (var i = 0; i < listItems.length; i++) {
				//POUR CHAQUE OBJET, ON VERIFIE SI COLLISION
				var itemCollision = this.checkCollision(listItems[i]); //ON PLACE LE RESULTAT DE checkCollision() DANS UNE VARIABLE : ELLE RETURN l'OBJET CONCERNE SI COLLISION. SINON ELLE RENVOIE FALSE
				if (itemCollision != false) {
					//SI checkCollision ne renvoie pas FALSE, c'est que COLLISION, ON PEUT SORTIR DE LA BOUCLE POUR EPARGNER DES RESSOURCES (le break) CAR IL NE PEUT PAS Y AVOIR DE COLLISIONS AVEC PLUSIEURS OBJETS EN MEME TEMPS.
					var collision = true;
					break;
				}
			}
			//ON VERIFIE SI L'OBJET EST TRAVERSABLE (ON PEUT RECUPERER CETTE INFO CAR checkCollision() RENVOIE L'OBJET COMPLET SI COLLISION DETECTEEs) OU S'IL N'Y A AUCUNE COLLISION
			if ((collision == true && itemCollision.traversable == 1) || (collision == false)) {
				$('#' + this.id).css(toModif, this.posX + 'px')
					.css('background', 'url("' + this.bgRight + '") no-repeat center center')
					.css('background-size', 'auto 100%');
			} else {
				//ON REMET LES ANCIENNES COORDONNEES SI COLLISION DETECTEE (POUR NE PAS AVOIR UN DECALAGE ENTRE L'ASPECT VISUEL ET L'ETAT DE NOTRE OBJET JOUEUR), ET ON NE FAIT PAS LE DEPLACEMENT CSS
				this.posX = oldPosX;
				this.posY = oldPosY;
			}
		} else if (e.which == 37) {
			var toModif = 'left';
			var newPos = this.posX - this.vitesseDeplacement;
			if (newPos < 0)
				this.posX = 0;
			else
				this.posX = newPos;

			var collision = false;
			for (var i = 0; i < listItems.length; i++) {
				var itemCollision = this.checkCollision(listItems[i]);
				if (itemCollision != false) {
					var collision = true;
					break;
				}
			}
			if ((collision == true && itemCollision.traversable == 1) || (collision == false)) {
				$('#' + this.id).css(toModif, this.posX + 'px')
					.css('background', 'url("' + this.bgLeft + '") no-repeat center center')
					.css('background-size', 'auto 100%');
			} else {
				this.posX = oldPosX;
				this.posY = oldPosY;
			}
		} else if (e.which == 38) {
			var toModif = 'top';
			var newPos = this.posY - this.vitesseDeplacement;
			if (newPos < 0)
				this.posY = 0;
			else
				this.posY = newPos;

			var collision = false;
			for (var i = 0; i < listItems.length; i++) {
				var itemCollision = this.checkCollision(listItems[i]);
				if (itemCollision != false) {
					var collision = true;
					break;
				}
			}
			if ((collision == true && itemCollision.traversable == 1) || (collision == false)) {
				$('#' + this.id).css(toModif, this.posY + 'px')
					.css('background', 'url("' + this.bgTop + '") no-repeat center center')
					.css('background-size', 'auto 100%');
			} else {
				this.posX = oldPosX;
				this.posY = oldPosY;
			}
		} else if (e.which == 40) {
			var toModif = 'top';
			var newPos = this.posY + this.vitesseDeplacement;
			if (newPos > this.maxY)
				this.posY = this.maxY;
			else
				this.posY = newPos;

			var collision = false;
			for (var i = 0; i < listItems.length; i++) {
				var itemCollision = this.checkCollision(listItems[i]);
				if (itemCollision != false) {
					var collision = true;
					break;
				}
			}
			if ((collision == true && itemCollision.traversable == 1) || (collision == false)) {
				$('#' + this.id).css(toModif, this.posY + 'px')
					.css('background', 'url("' + this.bgBottom + '") no-repeat center center')
					.css('background-size', 'auto 100%');
			} else {
				this.posX = oldPosX;
				this.posY = oldPosY;
			}
		} else {
			alert('Utilisez les touches directionnelles du clavier pour vous déplacer');
		}
	},
	inventaire: function() { //METHODE GERANT L'AFFICHAGE DE L'INVENTAIRE ET SON CONTENU. CHAQUE PRESSION SUR ESPACE OUVRE ET FERME L'INVENTAIRE
		if (stateInventaire == 0) { //stateInventaire est DEFINI EN DEBUT DE FICHIER, PAR DEFAUT A 0 CAR INVENTAIRE FERME
			$('#' + zoneJeu.id).append('<div id="inventory"></div>');
			stateInventaire = 1; //ON INDIQUE AU SYSTEME QUE L'INVENTAIRE EST OUVERT, POUR POUVOIR LE FERMER PAR LA SUITE
			for (var value in this.contenuInventaire) { //ON PARCOURT LE TABLEAU CONTENANT LES ITEMS DE L'INVENTAIRE, ET ON LES AFFICHE
				$('#inventory').append('<div id="action' + value + '">' + value + ' : ' + this.contenuInventaire[value] + '</div>');

				//ON CREE UN ECOUTEUR SUR L'ELEMENT EN TRAIN D'ETRE PARCOURU AFIN DE LANCER L'ACTION AFFERENTE A L'ITEM SELECTIONNE (joueur.actionInventaire)
				$('#inventory').on('click', '#action' + value, function() {
					joueur.actionInventaire(this.id); //ICI this.id CORRESPOND A L'ID DE L'ELEMENT SUR LEQUEL ON A CLIQUE, ET NON PLUS A L'ID DU JOUEUR, CAR NOUS SOMMES DANS UNE FONCTION. ON PASSE EN PARAMETRE l'ID DE L'ELEMENT SUR LEQUEL ON A CLIQUE A actionInventaire().
				})
			}
		} else {
			$('#inventory').remove(); //ON SUPPRIME LA DIV INVENTAIRE ET SON CONTENU
			stateInventaire = 0;
		}
	},
	actionInventaire: function(action) { //PARAMETRE : ID DE L'ELEMENT SUR LEQUEL ON A CLIQUE
		if (action == 'actionBicyclette') {
			this.inventaire(); //ON FERME L'INVENTAIRE (PUISQUE stateInventaire EST FORCEMENT SUR 1 LORS DU CLIC -> UNE ACTION NE SE DECLENCHE JAMAIS SEULE)
			this.vitesseDeplacement = 50; //ON MODIFIE LA VITESSE DE DEPLACEMENT DU JOUEUR
			this.bgLeft = 'assets/img/player/leftCycle.png'; //ON MODIFIE SON SKIN
			this.bgRight = 'assets/img/player/rightCycle.png';
			this.bgTop = 'assets/img/player/topCycle.png';
			this.bgBottom = 'assets/img/player/bottomCycle.png';
			actionInProgress = action;
		} else if (action == 'stopactionBicyclette') {
			this.vitesseDeplacement = 10; //ON MODIFIE LA VITESSE DE DEPLACEMENT DU JOUEUR
			this.bgLeft = 'assets/img/player/left.png'; //ON MODIFIE SON SKIN
			this.bgRight = 'assets/img/player/right.png';
			this.bgTop = 'assets/img/player/top.png';
			this.bgBottom = 'assets/img/player/bottom.png';
			actionInProgress = null;
		}
	},
	checkCollision: function(item) {
		//ON VERIFIE SI LE PERSONNAGE ENTRE EN COLLISION AVEC l'OBJET ITEM PASSE EN PARAMETRE. CETTE METHODE EST APPELEE LORS DE CHAQUE DEPLACEMENT ET TESTE UN PAR UN CHAQUE OBJET CONTENU dans listItems[] 
		//LA CONDITION POUR VERIFIER LA COLLISION PEUT ETRE TROUVEE ICI : 'https://developer.mozilla.org/fr/docs/Games/Techniques/2D_collision_detection'. ELLE CALCULE LA POSITION DE CHAQUE POINT DES "BOITES" TESTEES ET LES COMPARE A CEUX DU JOUEUR.
		if (this.posX < item.posX + item.width &&
			this.posX + this.width > item.posX &&
			this.posY < item.posY + item.height &&
			this.height + this.posY > item.posY) {
			//SI IL ENTRE EN COLLISION, ON RENVOIE LA TOTALITE DE L'ITEM POUR TESTER S'IL EST TRAVERSABLE DANS LA METHODE joueur.deplace()
			item.actionItem(item);
			return item;
		} else {
			//SINON ON RENVOIE FALSE, PAS DE COLLISION AVEC L'ITEM PARCOURU
			return false;
		}
	}
}

//PROTOTYPE QUI NOUS SERVIRA DE "PATRON" POUR LA CREATION D'UN ITEM (ICI ELEMENT SUR LE MAP)
var item = {
	id: undefined,
	width: undefined,
	height: undefined,
	type: undefined,
	traversable: undefined,
	posX: undefined,
	posY: undefined,
	init: function(id, width, height, type, traversable, posX, posY) {
		this.id = id;
		this.width = width;
		this.height = height;
		this.type = type;
		this.traversable = traversable; //UTILE POUR joueur.checkCollision() et joueur.deplace(), ON SAURA AINSI SI L'ITEM DOIT BLOQUER LA POSITION DU JOUEUR
		this.posX = posX;
		this.posY = posY;
		if (this.type == 1)
			this.styleCss = 'herbes';
		if (this.type == 2)
			this.styleCss = 'maison';
		if (this.type == 3)
			this.styleCss = 'eau';
		if (this.type == 4)
			this.styleCss = 'porte';

		//AFFICHAGE EN HTML
		$('#' + zoneJeu.id).append('<div id="' + this.id + '" class="' + this.styleCss + '"></div>');
		$('#' + this.id).css('width', this.width + 'px')
			.css('height', this.height + 'px')
			.css('top', this.posY + 'px')
			.css('left', this.posX + 'px')
			.css('position', 'absolute');

		//ON AJOUTE L'ITEM A LA LISTE DES ITEMS listItems[], NOTAMMENT UTILISEE POUR TESTER LES COLLISIONS
		listItems.push(this);
	},
	actionItem: function(itemActionnable) {
		if (itemActionnable.id == 'maMaisonPorte')
			zoneJeu.displayMessage('Cette porte est fermée à clef');
		else if (itemActionnable.type == 1) {
			var randomSpawn = parseInt(Math.random() * combat.chancesCombat);

			if (randomSpawn == 1) {
				do {
					var selectRandom = parseInt(Math.random() * pokemons.length);
				}
				while (pokemons[selectRandom].name == pokedex[0].name || pokemons[selectRandom].pointDeVie == 0)

				combat.init(pokedex[0], pokemons[selectRandom]);
			}
		} else if (itemActionnable.type == 3)
			zoneJeu.displayMessage('Tu ne sais pas nager, il te faut un objet spécial pour traverser...');
	}
}

var combat = {
	idBox: 'combatBox',
	displayAttacks: 0,
	chancesCombat: 10,
	init: function(pokemonJoueur, pokemonAdversaire) {
		actionInProgress = 'combat';
		$('#' + zoneJeu.id).append('<div id="' + this.idBox + '"></div>');
		$('#' + this.idBox).append('<div id="combatBoxPokemonJoueur"></div>');
		$('#' + this.idBox).append('<div id="combatBoxPokemonAdversaire"></div>');
		$('#' + this.idBox).append('<div id="combatBoxPokemonJoueurInfos"><h2>' + pokemonJoueur.name + '</h2><span>:N' + pokemonJoueur.niveau + '</span><div id="pokemonJoueurInfosCadre"><div id="pokemonJoueurAction"><span id="nbPVJoueur">' + pokemonJoueur.pointDeVie + '/' + pokemonJoueur.pointDeVieMax + '</span></div><div id="pokemonJoueurInfosPV"></div></div></div>');
		$('#' + this.idBox).append('<div id="combatBoxPokemonAdversaireInfos"><h2>' + pokemonAdversaire.name + '</h2><span>:N' + pokemonAdversaire.niveau + '</span><div id="pokemonAdversaireInfosCadre"><div id="pokemonAdversaireInfosPV"></div></div></div>');

		$('#pokemonJoueurInfosPV').append('<div id="contentBarPV">PV:<div id="barPVJoueur"><div id="pvJoueur"></div></div></div>');
		$('#pokemonAdversaireInfosPV').append('<div id="contentBarPV">PV:<div id="barPVAdversaire"><div id="pvAdversaire"></div></div></div>');
		$('#' + this.idBox).append('<div id="combatBoxActions"><span id="selectAttack">ATTAQUER</span><br/><span id="runaway">FUIR</span><br/>SAC</div>');

		this.majInfo(pokemonJoueur, pokemonAdversaire);

		$('#combatBoxPokemonJoueur').css('background', 'url("assets/img/pokemons/' + pokemonJoueur.name + 'Back.png") no-repeat center center');
		$('#combatBoxPokemonJoueur').css('background-size', 'contain');

		$('#combatBoxPokemonAdversaire').css('background', 'url("assets/img/pokemons/' + pokemonAdversaire.name + '.png") no-repeat center center');
		$('#combatBoxPokemonAdversaire').css('background-size', 'contain');

		$('body').on('click', '#runaway', function() {
			combat.runaway()
		});
		$('#' + this.idBox).on('click', '#selectAttack', function() {
			combat.selectAttack(pokemonJoueur, pokemonAdversaire);
		});
		$('#musicExploration')[0].pause();
		$('#musicCombat')[0].play();
	},
	runaway: function() {
		$('#' + this.idBox).remove();
		actionInProgress = null;
		$('#musicExploration')[0].play();
		$('#musicCombat')[0].pause();
		$('#musicCombat')[0].currentTime = 0;
	},
	selectAttack: function(pokemonJoueur, pokemonAdversaire) {
		if (this.displayAttacks == 0) {
			$('#' + this.idBox).append('<div id="selectorAttack"></div>');
			this.displayAttacks = 1;
			for (value in pokemonJoueur.attaques) {
				$('#selectorAttack').append('<input type="button" id="attack' + value + '" name="' + pokemonJoueur.attaques[value] + '" value="' + value + '"/><br/>');
				$('#selectorAttack').on('click', '#attack' + value, function() {
					combat.launchAttack(this.value, this.name, pokemonAdversaire, pokemonJoueur, 0);
				});
			}
		} else {
			$('#selectorAttack').remove();
			this.displayAttacks = 0;
		}
	},
	launchAttack: function(nomAttaque, valeurAttaque, cible, source, who) {
		zoneJeu.displayMessage(source.name + ' lance ' + nomAttaque + ' sur ' + cible.name + ' et lui fait ' + valeurAttaque + ' points de dégat');
		setTimeout("zoneJeu.removeMessage()", 2000);
        
        if(nomAttaque != 'Soins')
        {

            if (cible.pointDeVie - valeurAttaque <= 0) {
                cible.pointDeVie = 0;
                zoneJeu.displayMessage(cible.name + ' est K.O !');
                setTimeout("combat.runaway()", 1000);
            } else {
                cible.pointDeVie -= parseInt(valeurAttaque);
            }
        }
        else
        {
            var valeurSoins = 10;
            if(source.pointDeVie + valeurSoins  >= source.pointDeVieMax)
            {
                source.pointDeVie = source.pointDeVieMax;
            }
            else
            {
                source.pointDeVie += valeurSoins;
            }
        }
		if (who == 1)
			this.majInfo(cible, source);
		else
			this.majInfo(source, cible);


		if (who == 0) {
			this.selectAttack();
			var tailleTableau = function(monTableau) {
				var i = 0;
				for (value in monTableau) {
					i++;
				}
				return i;
			}

			var nbAttaques = tailleTableau(cible.attaques);
			var attaqueRandomize = parseInt(Math.random() * nbAttaques);
			var i = 0;
			var nomAttaque = undefined;
			var valeurAttaque = undefined;

			for (var value in cible.attaques) {
				if (i == attaqueRandomize) {
					nomAttaque = value;
					valeurAttaque = cible.attaques[value];
					break;
				}
				i++;
			}

			setTimeout(function() { 
				combat.launchAttack(nomAttaque, valeurAttaque, source, cible, 1)
			}, 2500);

		}

	},
	majInfo: function(pokemonJoueur, pokemonAdversaire) {
		var percentBarreJoueur = pokemonJoueur.pointDeVie / pokemonJoueur.pointDeVieMax * 100;

		$("#nbPVJoueur").text(pokemonJoueur.pointDeVie + '/' + pokemonJoueur.pointDeVieMax);
		$('#pvJoueur').css('width', percentBarreJoueur + '%');
		if (percentBarreJoueur < 75)
			$('#pvJoueur').css('background-color', 'yellow');
		if (percentBarreJoueur < 50)
			$('#pvJoueur').css('background-color', 'orange');
		if (percentBarreJoueur < 25)
			$('#pvJoueur').css('background-color', 'red');

		var percentBarreAdversaire = pokemonAdversaire.pointDeVie / pokemonAdversaire.pointDeVieMax * 100;

		$('#pvAdversaire').css('width', percentBarreAdversaire + '%');
		if (percentBarreAdversaire < 75)
			$('#pvAdversaire').css('background-color', 'yellow');
		if (percentBarreAdversaire < 50)
			$('#pvAdversaire').css('background-color', 'orange');
		if (percentBarreAdversaire < 25)
			$('#pvAdversaire').css('background-color', 'red');
	}
}

var pokemon = {
	name: undefined,
	pointDeVie: 0,
	pointDeVieMax: 0,
	niveau: 0,
	attaques: {},
	init: function(name, pointDeVie, niveau) {
		this.name = name;
		this.pointDeVie = pointDeVie;
		this.pointDeVieMax = pointDeVie;
		this.niveau = niveau;
		pokemons.push(this);
	},
	capture: function() {
		pokedex.push(this);
	}
}

var pikachu = Object.create(pokemon);
pikachu.init('pikachu', 20, 1);
pikachu.attaques = {
	'Eclair': 5,
	'Rugissement': 2,
    'Soins' : 0
};
pikachu.capture();

var roucool = Object.create(pokemon);
roucool.init('roucool', 12, 3);
roucool.attaques = {
	'Tornade': 10,
	'Cyclone': 3
};

var salameche = Object.create(pokemon);
salameche.init('salameche', 50, 5);
salameche.attaques = {
	'Flammeche': 30,
	'LanceFlamme': 2
};

var evoli = Object.create(pokemon);
evoli.init('evoli', 20, 2);
evoli.attaques = {
	'Meteorite': 7,
	'JetDeSable': 5
};

//CREATION DE LA ZONE DE JEU
zoneJeu.init();

//CREATION DE DIVERS ITEMS SUR LA MAP
var herbesHautes1 = Object.create(item);
herbesHautes1.init('herbesHautes1', 100, 100, 1, 1, 0, 100);

var herbesHautes2 = Object.create(item);
herbesHautes2.init('herbesHautes2', 50, 20, 1, 1, 100, 100);

var maMaison = Object.create(item);
maMaison.init('maMaison', 100, 68.08, 2, 0, 260, 120);

var maMaisonPorte = Object.create(item);
maMaisonPorte.init('maMaisonPorte', 15, 20, 4, 0, 294, 170.1);

var zoneEau = Object.create(item);
zoneEau.init('zoneEau', 400, 50, 3, 0, 0, 320);

var zoneEau2 = Object.create(item);
zoneEau2.init('zoneEau2', 50, 50, 3, 0, 350, 270);

//CREATION DU JOUEUR
joueur.init();

//ECOUTEUR SUR LES INPUT CLAVIER
$(document).keydown(function(e) {
	if (e.which == 88)
		joueur.actionInventaire('stop' + actionInProgress);
	else if (e.which == 32 && actionInProgress != 'combat')
		joueur.inventaire();
	else if (actionInProgress != 'combat' && stateInventaire != 1)
		joueur.deplace(e);
});