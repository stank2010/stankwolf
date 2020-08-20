
const express = require('express');
const app = express();

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3000;


let role = {"werewolf":0,"villager":0,"seer":0,"bodyguard":0};
let roleSeq = ["werewolf","seer","bodyguard"];
let roleSeq_action = ["kill","see","guard"];
let roleSeq_script = [
	"Werewolf : choose player to be eliminate",
	"Seer : choose player to check werewolf",
	"Bodyguard : pok pong kai krub?"
];



let temp_player = {
	name 	: "",
	role 	: "",
	IsReady : false,
	IsAlive : true,
	status  : [],
	Vote 	: "",
	Validate: 0, // validate หรือยัง -1=yes 0=not already  1=no
};

let	temp_room = {
	Name 	: "",
	Rstate 	: "",
	Player 	:[],
	Role 	: role,
	log		: "",
	Say 	: "Hello",
};




let Room = {
	'Mock_Room':{
		Name 	: "Mock_Room",
		Rstate : "Day",
		Player :[ 
			{
				name 	: "stank",
				role 	: "seer",
				IsReady : false,
				IsAlive : true,
				status  : ['toxic','kill','guard',"voted"],
				Vote 	: "",
				Validate:0
			}
		],
		Role : role,
		log  : "",
		Say  : "Hi"
	}
};

function IsRemain(nRoom,nRole){
	let edite_room = {...Room[nRoom]};
	//if(edite_room == undefined)return 0;
	//if(edite_room.Player == undefined)return 0;	
	let count_nRole = 0;
	edite_room.Player.forEach((people)=>{
		if(people.role == nRole && people.IsAlive)
			count_nRole++;
	});
	//console.log(count_nRole,nRole);
	return (count_nRole>0);
}


function shift_state(Rstate,nRoom){
	for(let i=0;i<roleSeq.length-1;i++){
		if(Rstate == roleSeq[i]){
			if(IsRemain(nRoom,roleSeq[i+1]))
				return roleSeq[i+1];
			else 
				Rstate = roleSeq[i+1];
		}
		//console.log("stank2__",Rstate);
	}

	if(Rstate == roleSeq[roleSeq.length-1])
		return "Effect";

	if(Rstate == "Effect"){
		return "Vote";
	}

	if(Rstate == "Vote")
		return "Validate";

	if(Rstate == "Validate")
		return "Result";

	if(Rstate == "Result")
		return roleSeq[0];
}

function reset_game(homeroom){
	homeroom.Rstate = "";
	homeroom.log = "";
	homeroom.Player.forEach((people,index)=>{
		homeroom.Player[index].IsAlive = true;
		homeroom.Player[index].IsReady = false;
		homeroom.Player[index].role = "";
		homeroom.Player[index].status = [];
		homeroom.Player[index].Vote = "";
		homeroom.Player[index].Validate = 0;
	});
	return homeroom;
}


function reset_ready(nRoom){
	Room[nRoom].Player.forEach((people,index)=>{
		Room[nRoom].Player[index].IsReady = false;
	});
}

function reset_vote(nRoom){
	Room[nRoom].Player.forEach((people,index)=>{
		Room[nRoom].Player[index].Vote = "";
	});
}

function reset_validate(nRoom){
	Room[nRoom].Player.forEach((people,index)=>{
		Room[nRoom].Player[index].Validate = 0;
	});
}

function resEffect(nRoom){
	let edite_room = {...Room[nRoom]};
	edite_room.Say = "";
	edite_room.Player.forEach((people,index)=>{
		let Arr = people.status;
		
		console.log(people.name,Arr);

		if(Arr.includes("kill")){
			if(!Arr.includes("guard")){
				edite_room.Player[index].IsAlive = false;
				edite_room.Say += `player ${people.name} : Die  (${people.role})\n`;
			}
		}
		edite_room.Player[index].status = [];
	});
	Room[nRoom] = edite_room;
	return edite_room.Say; //+ "===="+edite_room.log;
}

function count_die(nRoom){
	let edite_room = {...Room[nRoom]};
	let count = 0;
	edite_room.Player.forEach((people,index)=>{
		if(people.IsAlive == false) count++;
	});
	return count;
}

function end_game(nRoom){
	//Todo ...
}

function get_name(nRoom){
	let edite_room = {...Room[nRoom]};
	let Arr = [];
	edite_room.Player.forEach((people,index)=>{
		Arr.push(people.name);
	});
	return Arr;
}

function get_name_alive(nRoom){
	let edite_room = {...Room[nRoom]};
	let Arr = [];
	
	//console.log("name alive",edite_room);
	if(edite_room == undefined)return [];
	if(edite_room.Player == undefined)return [];

	edite_room.Player.forEach((people,index)=>{
		if(people.IsAlive)
			Arr.push(people.name);
	});
	return Arr;
}

function IsWerewolf(nRole){
	if(nRole == "werewolf")
		return true;
	else 
		return false;
}

function get_endGame(nRoom){  // -1 = wolfwin , 0 = nothing , 1 = villager win
	let edite_room = {...Room[nRoom]};
	
	if(edite_room == undefined)return 0;
	if(edite_room.Player == undefined)return 0;	

	let wolfside=0,villside=0;
	edite_room.Player.forEach((people,index)=>{
		if(people.IsAlive){
			if(IsWerewolf(people.role))
				wolfside++;
			else 
				villside++;
		}
	});

	if(wolfside == 0)
		return 1;
	else if(wolfside >= villside)
		return -1;
	else 
		return 0;
}

function edite_player(nRoom,nPlayer,header,value){


}


//============== SOCKET IO ============================================

io.on('connection',(socket)=>{

	console.log('user connect');
	//=========Admin zone===========
	socket.on('get log',(data)=>{
		socket.emit('get log',{log:Room[data.room_name].log});
	});

	socket.on('delete player',(data)=> { //TODO THING
		let Room_ = data.room_name;
		let Player = data.player_name;
		let edite_room = {...Room[Room_]};

		if(edite_room == undefined)return 0;
		if(edite_room.Player == undefined)return 0;

		let del_index = -1;
		edite_room.Player.forEach((people,index)=>{
			if(people.name == Player){
				del_index = index;
			}
		});

		if(del_index != -1)
			edite_room.Player.splice(del_index,1);
		else 
			return 0;

		if(edite_room.Player.length == 0){
			delete Room[Room_];
			//Room[Room_] = undefined;
		}
		else 
			Room[Room_] = edite_room;

		let send_data = get_name_alive(data.room_name);
		socket.emit('get name',{room_name:data.room_name,aName:send_data});
		socket.broadcast.emit('get name',{room_name:data.room_name,aName:send_data});		
		console.log("All Room",Room);
	});

	socket.on('delete room',(data)=>{
		let Room_ = data.room_name;
		delete Room[Room_];
	});

	socket.on('get all room',(data)=>{
		socket.emit('get all room',{room:Room});
	});
	//=============================

	socket.on('get room',(data)=>{
		socket.emit('get room',Room[data.room_name]);
	});
/*
	socket.on('get all name',(data)=>{
		let send_data = get_name_alive(data.room_name);
		socket.emit('get name',{room_name:data.room_name,aName:send_data});
		socket.broadcast.emit('get name',{room_name:data.room_name,aName:send_data});
	});
*/
	socket.on('get name',(data)=>{
		let send_data = get_name_alive(data.room_name);
		socket.emit('get name',{room_name:data.room_name,aName:send_data});
		socket.broadcast.emit('get name',{room_name:data.room_name,aName:send_data});
	});

	socket.on('wolfreset',(data)=>{
		let Room_ = data.room_name;
		edite_room = {...Room[Room_]};
		edite_room = reset_game(edite_room);
		Room[Room_] = edite_room;

		socket.emit("change rState",{room_name:data.room_name,rState:edite_room.Rstate,log:edite_room.log});
		socket.broadcast.emit("change rState",{room_name:data.room_name,rState:edite_room.Rstate,log:edite_room.log});
	});

	socket.on('ghost zone',(data)=>{
		let Room_ = data.room_name;
		edite_room = {...Room[Room_]};
		socket.emit("ghost zone",{room_name:data.room_name,log:edite_room.log});		
	});

	socket.on('wolfroom',(data)=>{
		let Player = data.player_name;
		let Room_ = data.room_name;
		let new_room = {...temp_room};
		let new_player = {...temp_player};

		if(Room[Room_] != undefined)return 0;

		new_player.name = Player;
		new_room.Player = [new_player];

		new_room.Name = Room_;
		Room[Room_] = new_room;

		console.log(Room[Room_]);
	});


	socket.on('wolfjoin',(data)=>{
		let Player = data.player_name;
		let Room_ = data.room_name;

		let new_player = {...temp_player};
		new_player.name = Player;

		if(Room[Room_] == undefined)return 0;
		let edite_room = {...Room[Room_]};
		let found = false;

		edite_room.Player.forEach((people)=>{
			if(people.name == Player){
				found = true;
			}
		});
		if(found)
			return 0;
		else 
			edite_room.Player.push(new_player);
		Room[Room_] = edite_room;
		
		console.log(Room[Room_]);
	});

	socket.on('roleList',(data)=>{
		let Room_ = data.room_name;
		let new_role = data.role;
		let edite_room = {...Room[Room_]};
		edite_room.Role = {...edite_room.Role,...new_role};
		Room[Room_] = {...edite_room};
		console.log(edite_room.Role);
		socket.emit('roleList',{room_name:Room_ ,role:edite_room.Role});
		socket.broadcast.emit('roleList',{room_name:Room_ ,role:edite_room.Role});
	});

	socket.on('Ready',(data)=>{
		let Player = data.player_name;
		let Room_ = data.room_name;

		let edite_room = {...Room[Room_]};
		let nReady = 0;
		let len = edite_room.Player.length;

		edite_room.Player.forEach((item,index)=>{
			if( item.name == Player )
				edite_room.Player[index].IsReady = true;

			if(edite_room.Player[index].IsReady && edite_room.Player[index].IsAlive)
				nReady++;
		});

		console.log(Room_+":"+Player+"Ready");
		if(nReady == len - count_die(Room_)){
			//shuffle role
			if(edite_room.Rstate == ""){
				let inRole = {...edite_room.Role};
				let Player = edite_room.Player;
				let pCheck = new Array(len).fill(0);
				let inNameRole = Object.keys(inRole); 
				inNameRole = inNameRole.filter(name => inRole[name]>0);
				let nRole = inNameRole.length;

				Player.forEach((item,index)=>{
					let Rindex = Math.floor(Math.random() * nRole)
					while(inRole[ inNameRole[Rindex] ] == 0){
						Rindex = Math.floor(Math.random() * nRole)
					}
					Player[index].role = inNameRole[Rindex];
					inRole[inNameRole[Rindex]]--;
				});
				
				edite_room.Player = Player;
				edite_room.Rstate = roleSeq[0];

				reset_ready(Room_);

				//socket.emit("change rState",{rState:edite_room.Rstate});
				//socket.broadcast.emit("change rState",{rState:edite_room.Rstate});
			}
			else if(edite_room.Rstate == "Effect" || edite_room.Rstate == "Result"){
				edite_room.Rstate = shift_state(edite_room.Rstate,Room_);
				reset_ready(Room_);
				let End = get_endGame(Room_);
				if(End != 0){
					let Message = "Werewolf Win";
					if(End == 1)
						Message = "Villager Win";
					
					socket.emit('End game',{room_name:Room_ , message:Message});	
					socket.broadcast.emit('End game',{room_name:Room_ , message:Message});	
					edite_room.Rstate = "End";
				}
			}
			Room[Room_] = edite_room;
			socket.emit("change rState",{room_name:Room_ , rState:edite_room.Rstate ,log:edite_room.log});
			socket.broadcast.emit("change rState",{room_name:Room_ , rState:edite_room.Rstate ,log:edite_room.log});
			return 0;
		}
		/*
		if(nReady == len && edite_room.Rstate == "End"){
			edite_room = reset_game(edite_room);

			Room[Room_] = edite_room;
			socket.emit("change rState",{rState:edite_room.Rstate});
			socket.broadcast.emit("change rState",{rState:edite_room.Rstate});
			console.log(edite_room);
		}
		*/

		Room[Room_] = edite_room;

	});

	socket.on('myStatus',(data)=>{
		let nPlayer = data.player_name;
		let nRoom = data.room_name;
		let edite_room = Room[nRoom];

		console.log("==myStatus==",edite_room);
		if(edite_room == undefined)return 0;
		if(edite_room.Player == undefined)return 0;

		edite_room.Player.forEach((people,index)=>{
			if(people.name == nPlayer){
				socket.emit('myStatus',{role:people.role,GameState:edite_room.Rstate,IsAlive:people.IsAlive});
			}
		});
	});

	socket.on('playRole',(data)=>{
		let nPlayer = data.player_name;
		let nRoom = data.room_name;

		let edite_room = {...Room[nRoom]};
		edite_room.Player.forEach((people,index)=>{
			if(people.name == nPlayer && roleSeq.indexOf(people.role) != -1 && people.role == edite_room.Rstate){
				socket.emit('playRole',{yourTurn:true,script:roleSeq_script});
			}
		});
	
		socket.emit('playRole',{yourTurn:false,script:"Wait "+edite_room.Rstate});
	});

	socket.on('playAction',(data)=>{
		let nPlayer = data.player_name;
		let nRoom = data.room_name;
		let nWho = data.who_name;

		let edite_room = {...Room[nRoom]};
		let yesOk = false;
		let rDoer = "";
		edite_room.Player.forEach((people,index)=>{
			if(people.name == nPlayer && roleSeq.indexOf(people.role) != -1 && people.role == edite_room.Rstate){
					yesOk = true;
					rDoer = people.role;
			}
		});

		if(yesOk){
			let Arr = [...edite_room.Player];
			Arr.forEach((people,index)=>{
				if(people.name == nWho){
					//edite_room.Player[index].status.push(roleSeq_action[ roleSeq.indexOf(rDoer) ]); //<<<<<<<<<<<<<< may bug
					let Status = [...Arr[index].status];
					Status.push(roleSeq_action[ roleSeq.indexOf(rDoer) ]);
					Arr[index].status = Status;

					if(edite_room.Rstate == "seer")
					{
						let txt = "not werewolf"
						if(people.role == "werewolf")
							txt = "werewolf";

						socket.emit("eye of seer",{player_name:nWho,result:txt});
					}

					var d = new Date();
	  				var n = d.getHours() + ":" + d.getMinutes() + "น.";
					edite_room.log += `${n}	: ${nPlayer}(${rDoer}) -> ${nWho}(${people.role}) \n`;
				}

				console.log(people,edite_room.Player[index].status);
			});
			edite_room.Player = Arr;

			edite_room.Rstate = shift_state(edite_room.Rstate,nRoom);
			
			/*
			while(edite_room.Rstate != "Effect" && edite_room.Role[edite_room.Rstate] == 0){
				edite_room.Rstate  = shift_state(edite_room.Rstate,nRoom);
				//console.log("==stank==",edite_room.Rstate);
			}
			*/
			
			//console.log("before",Room[nRoom]);
			
			Room[nRoom] = edite_room;
			
			//console.log("after",Room[nRoom]);

			if(edite_room.Rstate == "Effect"){
				let Say = resEffect(nRoom);
          		socket.emit("Effect",{room_name:nRoom , res:Say });
          		socket.broadcast.emit("Effect",{room_name:nRoom , res:Say });
          		//socket.emit('get room',Room[nRoom]);
			}

			socket.emit("change rState",{room_name:nRoom , rState:edite_room.Rstate ,log:edite_room.log});
			socket.broadcast.emit("change rState",{room_name:nRoom , rState:edite_room.Rstate ,log:edite_room.log});
		}
	});


	socket.on('Vote',(data)=>{
		let nPlayer = data.player_name;
		let nRoom = data.room_name;
		let nWho = data.who_name;
		let edite_room = {...Room[nRoom]};

		let len = edite_room.Player.length;
		let vote_count = 0;
		console.log(nPlayer," just vote");

		var d = new Date();
		var n = d.getHours() + ":" + d.getMinutes() + "น.";
		edite_room.log += `${n}	: ${nPlayer}(vote) -> ${nWho} \n`;

		edite_room.Player.forEach((people,index)=>{
			if(people.name == nPlayer){
				edite_room.Player[index].Vote = nWho;
			}

			if(edite_room.Player[index].Vote != "")
				vote_count++;
		});

		if(vote_count == len - count_die(nRoom)){
			let Khon = get_name(nRoom);
			let Count = Array(Khon.length).fill(0);
			let Max = 0;
			let Most = [];
			edite_room.Player.forEach((people,index)=>{
				let ind = Khon.indexOf(people.Vote);
				if(ind != -1){
					Count[ ind ]++;
					if(Count[ ind ] > Max)
						Max = Count[ ind ];
				}
			});

			let index_vote = -1;
			Khon.forEach((item,index)=>{
				if(Count[index]==Max){
					Most.push(item);
					index_vote = index;
				}
			});

			if(Most.length == 1){
				//edite_room.Player[index_vote].IsAlive = false;
				edite_room.Player[index_vote].status.push("voted");
				edite_room.Rstate = shift_state(edite_room.Rstate,nRoom);
				socket.emit('Jumlei',{room_name:nRoom , player_name:Most[0]});
				socket.broadcast.emit('Jumlei',{room_name:nRoom , player_name:Most[0]});
				
				var d = new Date();
	  			var n = d.getHours() + ":" + d.getMinutes() + "น.";
				edite_room.log += `${n}	: [Result Vote] -> ${Most[0]} die\n`;
			}
			else{
				for(let i=0;i<3;i++)
					edite_room.Rstate = shift_state(edite_room.Rstate,nRoom);
			}
			//edite_room.Rstate = shift_state(edite_room.Rstate,Room_);	
			reset_vote(nRoom); //adding 

			Room[nRoom] = edite_room;

			socket.emit("change rState",{room_name:nRoom , rState:edite_room.Rstate ,log:edite_room.log});
			socket.broadcast.emit("change rState",{room_name:nRoom , rState:edite_room.Rstate ,log:edite_room.log});
			return 0;
		}

		Room[nRoom] = edite_room;

	});

	socket.on('Validate',(data)=>{  //yesno: 1=yes -1=no
		let nPlayer = data.player_name;
		let nRoom = data.room_name;
		let yesno = data.yesno;
		let edite_room = {...Room[nRoom]};

		console.log("Validate__",nRoom);
		console.log("Validate",edite_room);

		let count = 0 , sum = 0;
		let len = edite_room.Player.length;
		let voted_man = -1;

		edite_room.Player.forEach((people,index)=>{
			if(edite_room.Player[index].status.includes("voted")){
				voted_man = index;
			}

			if(people.name == nPlayer){
				people.Validate = yesno;
			}
			if(people.Validate !=0 )
				count++;
			sum += people.Validate;
		});

		if(count == len - count_die(nRoom)){
			edite_room.Player[voted_man].status = [];
			let txt;
			if(sum > 0){
				edite_room.Player[voted_man].IsAlive = false;
				txt = "คุณ "+edite_room.Player[voted_man].name+" ได้ตายเป็นที่เรียบร้อย เขาคือ "+edite_room.Player[voted_man].role;

			}
			else{
				txt = "คุณ "+edite_room.Player[voted_man].name+" ยังไม่ตาย ขอบคุณพระเจ้าที่ทำให้เขารอด!";
			}
			
			socket.emit("Effect",{room_name:nRoom , res:txt});
			socket.broadcast.emit("Effect",{room_name:nRoom , res:txt});

			edite_room.Rstate = shift_state(edite_room.Rstate,nRoom);
			reset_validate(nRoom);
		}

		Room[nRoom] = edite_room;

		socket.emit("change rState",{room_name:nRoom , rState:edite_room.Rstate ,log:edite_room.log});
		socket.broadcast.emit("change rState",{room_name:nRoom , rState:edite_room.Rstate ,log:edite_room.log});
	});

	//============== Adding ================
/*
	socket.on("Effect",(data)=>{
		let edite_room = {...Room[data.room_name]};
		edite_room.Say = "";
		edite_room.Player.forEach((people,index)=>{
			let Arr = Room[nRoom].Player[index].status;
			if(Arr.includes("kill")){
				if(!Arr.includes("guard")){
					edite_room.Player[index].IsAlive = false;
					edite_room.Say += `${people.name} : Die \n`;
				}
			}
			edite_room.Player[index].status = [];
		});
		Room[nRoom] = edite_room;
	});
*/

	socket.on('disconnect',()=>{

	});
});


server.listen(port, () => console.log(`start on port ${port}`))
