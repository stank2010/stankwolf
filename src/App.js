import React from 'react';
import './App.css';
import socketIOClient  from 'socket.io-client';

import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import {  withStyles, styled  } from '@material-ui/core/styles';

import Chip from '@material-ui/core/Chip';
import Container from '@material-ui/core/Container';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import FaceIcon from '@material-ui/icons/Face';
import Divider from '@material-ui/core/Divider';


function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://material-ui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const style = (theme) => ({
  root: {
    height: '100vh',
  },
  image: {
    backgroundImage: 'url(https://source.unsplash.com/random)',
    backgroundRepeat: 'no-repeat',
    backgroundColor:
      theme.palette.type === 'light' ? theme.palette.grey[50] : theme.palette.grey[900],
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  paper: {
    margin: theme.spacing(8, 4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  paper2: {
    margin: theme.spacing(1, 1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  papers: {
    margin: theme.spacing(4, 8),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});


const  socket = socketIOClient('http://35.247.169.0:8011/');  
let roleSeq = ["werewolf","seer","bodyguard"];
let role = {"werewolf":0,"villager":0,"seer":0,"bodyguard":0};
let allrole = ["werewolf","seer","bodyguard","villager"];
let roleSeq_script = [
	"Werewolf : choose player to be eliminate",
	"Seer : choose player to check werewolf",
	"Bodyguard : pok pong kai krub?" 
];


class App extends React.Component {

  state = {
    name:"",
    room:"",
    role:"",
    Res_eff:"",
    IsAlive:true,
    rGameEnd:"who win",
    rJumlei:"",
    log:"default",
    rState:"", //room state
    lState:"select", //local state
    aName:[],
    Next:"Ready",
    IsVote:false,
    IsValidate:false,
    ls_role : role,
    seerEye : ""
  };



  res = () => {
/*
    socket.on('get room',(data)=>{
      this.setState({Room:data});
    });
*/
    socket.on('change rState',(data)=>{
      if(data.room_name == this.state.room){
        if(data.rState != this.state.rState){
          //console.log(this.state);
          socket.emit('myStatus',{player_name:this.state.name,room_name:this.state.room});
          
          if(data.rState == "Effect" || data.rState == "Result" || data.rState == ""){
            socket.emit("get name",{room_name:this.state.room});          
            this.setState({IsVote:false,IsValidate:false}); //adding
          }

          if(data.rState == ""){
            this.setState({seerEye:""});
          }

          if(this.state.IsAlive == false){
            socket.emit('ghost zone',{room_name:this.state.room});         
          }
  
          this.setState({rState:data.rState,log:data.log});
        }
        this.setState({Next:"Ready"});
      }
    });
    
    
    socket.on('get room',(data)=>{
      //console.log(data);
    });

    socket.on('get name',(data)=>{
      if(data.room_name == this.state.room){
        this.setState({aName:data.aName});
        if(data.aName.length == 0 || (data.aName.indexOf(this.state.name) == -1 && this.state.rState=="" && this.state.lState =="inRoom") )//|| data.aName.indexOf(this.state.name) == -1 )
          window.location.reload(false); 
      }
    });

    socket.on('myStatus',(data)=>{
      this.setState({role:data.role,IsAlive:data.IsAlive});
    });

    socket.on('roleList',(data)=>{
      if(data.room_name == this.state.room){
        this.setState({ls_role:data.role});
      }
    });

    socket.on('eye of seer',(data)=>{
      let txt = data.player_name + " is " + data.result;
      //alert(txt);
      this.setState({seerEye:txt});
    });

    socket.on('Effect',(data)=>{
      if(data.room_name == this.state.room){
        this.setState({Res_eff:data.res});
      }
    });

    socket.on('End game',(data)=>{
      if(data.room_name == this.state.room){
        this.setState({rGameEnd:data.message , IsVote:false,IsValidate:false,rJumlei:""});  
      }
    });
  
    socket.on('Jumlei',(data)=>{
      if(data.room_name == this.state.room){
        this.setState({rJumlei:data.player_name});        
      }

    });

    socket.on('ghost zone',(data)=>{
      this.setState({log:data.log});
    });
  };

  nameChange = (e)=>{
    this.setState({name:e.target.value});
  }

  roomChange = (e)=>{
    this.setState({room:e.target.value});
  }

  eventCreate = ()=>{
    socket.emit(
      "wolfroom",
      {
        player_name:this.state.name,
        room_name : this.state.room
    });
    
    //console.log(this.state);
    socket.emit("get name",{room_name:this.state.room});
    this.setState({lState:"inRoom"});
  };

  eventJoin = ()=>{
    socket.emit(
      "wolfjoin",
      {
        player_name:this.state.name,
        room_name : this.state.room
    });

    socket.emit("get name",{room_name:this.state.room});
    this.setState({lState:"inRoom"});
  };

  eventReady = (e) => {
    this.setState({Next:"Waiting..."});
    socket.emit("Ready",{player_name:this.state.name , room_name:this.state.room});
  }

  eventChangeRole = (e)=>{
    //console.log(e.target.id,e.target.value);
    let ls_role = {};
    ls_role[e.target.id] = (e.target.value == "")? 0 : parseInt(e.target.value);
    socket.emit('roleList',{room_name:this.state.room,role:ls_role});
  }
  
  eventPlayAction = (e)=>{
    //console.log("id",e.target.id,e.target);
    socket.emit('playAction',{
      player_name : this.state.name,
      room_name   : this.state.room,
      who_name    : this.state.aName[e.currentTarget.id] // e.target.id -> e.currentTarget.id
    });
  }

  eventVote = (e)=>{
    this.setState({IsVote:true});
    socket.emit('Vote',{player_name:this.state.name ,room_name:this.state.room ,who_name:e.currentTarget.id  }); // e.target.id -> e.currentTarget.id
  }

  eventValidate = (e) =>{
    let yesno = parseInt(e.currentTarget.id); //e.target.id -> e.currentTarget.id
    this.setState({IsValidate:true});
    socket.emit('Validate',{player_name:this.state.name,room_name:this.state.room , yesno:yesno});
  }

  eventReset = (e) => {
    socket.emit('wolfreset',{room_name:this.state.room });
    //this.setState({IsVote:false,IsValidate:false});
  }

  eventDel = (name) => {
    //console.log("key",e.target.key );
    socket.emit('delete player',{room_name:this.state.room ,player_name:name });
  }
  

  myGame = (rState) => {
    const { classes } = this.props;

    const preRoom = 
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            S
          </Avatar>
          <Typography component="h1" variant="h5">
              Stankwolf
          </Typography>
          <form className={classes.form} noValidate>
              <TextField
                    onChange={this.nameChange}
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="Your name"
                    name="name"
                    autoComplete="name"
                    autoFocus
                />
                <TextField
                    onChange={this.roomChange}
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="Room name"
                    name="room"
                    autoComplete="room"
                    autoFocus
                />
              <Grid container>
                <Grid item xs>
                  <Button
                    onClick={this.eventCreate}
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                  >
                    Create
                  </Button>
                </Grid>
                <Grid item xs>              
                  <Button
                    onClick={this.eventJoin}
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                  >
                    Join
                  </Button>
                </Grid>
              </Grid>  
          </form> 
        </div>
      </Grid>;
    
    const inRoom = 
    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Container>
          <Typography component="h1" variant="h5">
              Room : {this.state.room}
          </Typography>
          <Typography component="h3" variant="h5">
              Name : {this.state.name}
          </Typography>

          <div className={classes.papers}>
            
            {this.state.aName.map((val,i)=>{
                  return(
                      <Chip id={val} label={val} onDelete={ ()=>this.eventDel(val)} variant="outlined" color="secondary" icon={<FaceIcon />} />
                  );
            })}
          </div>
          <Divider />          
          <div className={classes.paper2}>       
            <form className={classes.form} noValidate>
                
                {allrole.map((item,index)=>{
                  return(
                    <div className={classes.papers}>
                      <TextField
                        id={item}
                        label={item}
                        type="number"
                        InputLabelProps={{
                          shrink: true,
                        }}
                        onChange={this.eventChangeRole}
                        size="small"
                      />
                      <Typography variant="subtitle1">
                        {this.state.ls_role[item]}
                      </Typography>
                    </div>
                  );

                })}
                <Button
                  onClick={this.eventReady}
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                >       
                  {this.state.Next} 
                </Button>
            </form>
          </div>
        </Container>
    </Grid>

    const rState_Role = 
    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
      <Container>
        <Typography component="h2" variant="h5">
            Name : {this.state.name}
        </Typography>
        <Typography component="h2" variant="h5">
            Role : {this.state.role}
        </Typography>
        <Typography component="h2" variant="h5">
            Status : {(this.state.IsAlive)?"ยังไม่ตาย":"ตาย"}
        </Typography>
        {(this.state.role=="seer")?
          <Typography variant="body1"> 
            Seer message : {this.state.seerEye}
          </Typography>
          :<></> 
        }
        <Divider /> 
        <div className={classes.paper}>
          <Typography variant="body1">
            {
              (this.state.role == this.state.rState)?
                roleSeq_script[ roleSeq.indexOf(this.state.role) ]
              :
              "รอ "+this.state.rState
            }
          </Typography>
          <Divider /> 
          {
            (this.state.role == this.state.rState)?
              <>
              {
              this.state.aName.map((val,i)=>{
                return(
                  <Button id={i} color="primary" variant="contained"   size="medium"  onClick={this.eventPlayAction} >
                    {val}
                  </Button>
                  ); //Bug กดไม่ติด
              })
              }
              </>
            :
              <Typography component="h5" variant="h5">
                คุณยังไม่มีอะไรให้ต้องทำ
              </Typography>
          }
        </div>
      </Container>
    </Grid>;

    const rState_Effect = 
    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
      <div className={classes.paper}>       
        <Typography component="h1" variant="h5"> 
          คุณ {this.state.name} เป็น {this.state.role}
        </Typography>

        <Typography component="h1" variant="h5"> 
            <div>สถานะ {(this.state.IsAlive)?"ยังไม่ตาย":"ตาย"}</div>
        </Typography>
        {(this.state.role=="seer")?
          <Typography variant="body1"> 
            Seer message : {this.state.seerEye}
          </Typography>
          :<></> 
        }
        <Divider />
        {(this.state.Res_eff=="")?<Typography>ไม่มีอะไรเกิดขึ้น</Typography>:<></>}
        {this.state.Res_eff.split("\n").map((item)=>{return(<><Typography> {item}  </Typography><Divider light /></> );})}
        <Typography variant="body1">กรุณากดเพื่อดำเนินการต่อ</Typography>
        <Button variant="contained" size="medium" color="primary" onClick={this.eventReady} > {this.state.Next} </Button>

      </div>
    </Grid>;   

    const rState_Vote  =
    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
      <Container>
        <Typography component="h2" variant="h5">
            Name : {this.state.name}
        </Typography>
        <Typography component="h2" variant="h5">
            Role : {this.state.role}
        </Typography>
        <Typography component="h2" variant="h5">
            Status : {(this.state.IsAlive)?"ยังไม่ตาย":"ตาย"}
        </Typography>
        <Divider /> 
        <div className={classes.paper}>
          <Typography component="h5" variant="h5">
            คุณคิดว่าใครเป็นหมาป่า?
          </Typography>
          <Divider /> 
          { 
            (!this.state.IsVote)?
              <ButtonGroup
              orientation="vertical"
              color="primary"
              aria-label="vertical contained primary button group"
              variant="contained"
              >
                {this.state.aName.map((val,i)=>{
                        return(<Button id={val} onClick={this.eventVote} > {val} </Button>);
                })}
              </ButtonGroup>
            :
              <Typography component="h5" variant="h5">
                รอคนอื่นโหวตก่อนนะจ่ะ
              </Typography>
          }
        </div>
      </Container>
    </Grid>;    


    const rState_Validate = 
    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
      <Container>
        <Typography component="h2" variant="h5">
            Name : {this.state.name}
        </Typography>
        <Typography component="h2" variant="h5">
            Role : {this.state.role}
        </Typography>
        <Typography component="h2" variant="h5">
            Status : {(this.state.IsAlive)?"ยังไม่ตาย":"ตาย"}
        </Typography>
        <Divider /> 
        <div className={classes.paper}>
          <Typography component="h5" variant="h5">
            ยืนยันที่จะโหวตฆ่าจำเลย {this.state.rJumlei} ไหม?
          </Typography>
          <Divider /> 
          { (!this.state.IsValidate)?
            <>
              <Button   color="primary"   variant="contained"   size="medium"   id="1"   onClick={this.eventValidate}>  YES </Button>
              <Button   color="secondary" variant="contained"   size="medium"   id="-1"  onClick={this.eventValidate}>  NO  </Button>
            </>
            :
            <Typography component="h5" variant="h5">
              รอคนอื่นยืนยันแปปนะจ่ะ
            </Typography>            
          }
        </div>
      </Container>
    </Grid>;     

    const rState_Result = 
    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
      <div className={classes.paper}>       
        <Typography component="h1" variant="h5"> 
          คุณ {this.state.name} เป็น {this.state.role}
        </Typography>
        <Typography component="h1" variant="h5"> 
            <div>สถานะ {(this.state.IsAlive)?"ยังไม่ตาย":"ตาย"}</div>
        </Typography>
        <Divider />
        <Typography variant="body1">
          {this.state.Res_eff}
        </Typography>
        <Button color="primary" variant="contained" size="medium" onClick={this.eventReady} > {this.state.Next} </Button>
      </div>
    </Grid>;       

    const ghostMode = 
    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
      <div className={classes.paper}>       
        <Typography component="h1" variant="h5"> 
          คุณ {this.state.name} เป็น {this.state.role}
        </Typography>
        <Typography component="h1" variant="h5"> 
          สถานะ {(this.state.IsAlive)?"ยังไม่ตาย":"ตาย"}
        </Typography>
        <Divider />
        <Typography variant="body1">
           ผี zone 
        </Typography>
        <Divider />
          {this.state.log.split('\n').map((item,index)=>{ 
            return(
            <Typography variant="body1" key={index}>  
              {item} 
            </Typography>
            ); 
          })}

      </div>
    </Grid>;         

    const rState_End =
    <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          End
        </Avatar>
        <Typography variant="h4">
            End Game
        </Typography>

        <Typography variant="body1">
            Result : {this.state.rGameEnd}
        </Typography>
        <Button variant="contained" size="large" color="primary" onClick={this.eventReset} color="primary" > 
          {this.state.Next} 
        </Button>
      </div>
    </Grid>;

    if(rState == ""){
      if(this.state.lState == "select")
        return(preRoom);
      else if(this.state.lState == "inRoom"){
        //socket.emit('roleList',{room_name:this.state.room,role:{}}); mai kurn sai wai tong nee
        return(inRoom);
      }
    }else if(rState == "End"){
      return(rState_End);
    }
    else if(this.state.IsAlive == false){ //die
      return(ghostMode);
    }
    else if(roleSeq.indexOf(rState) != -1 ){
      return(rState_Role);
    }
    else if(rState == "Effect"){
      return(rState_Effect);
    }
    else if(rState == "Vote"){
      return(rState_Vote);
    }
    else if(rState == "Validate"){
      return(rState_Validate);
    }
    else if(rState == "Result"){
      return(rState_Result );
    }
    else { // default
      return(
        <div>
          Hello world , let's fix bug man
        </div>
      )
    }
  };
  componentDidMount(){
    this.res();
  }

  render(){

    const { classes } = this.props;
    
    return(
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <Grid item xs={false} sm={4} md={7} className={classes.image} />
        {this.myGame(this.state.rState)} 
      </Grid>
    );

  }
}

export default withStyles(style)(App);



/*
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
*/