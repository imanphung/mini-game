const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const questions=require('./question');
let listuser=[];
let listquestions=[];
let i=0;   //id user
listquestions=ListQuestions(); //random 5 questions
io.on('connection',function(socket){
    socket.on('client_username',function(data){
        let flag=0;
        for(let i =0;i<listuser.length;i++){ //check username
            if(listuser[i].name===data.name){
                flag=1;
                break;
            }
        }
        if(flag===0){
            listuser.push(new User(i,data.name,0));
            io.emit('server_id',i);
            io.emit('server_listquestions',listquestions);
            io.emit('server_username',listuser);    
            i++;
        }
        else{
            listuser.push(new User(i,"@"+data.name,0));
            io.emit('server_id',i);
            io.emit('server_listquestions',listquestions);
            io.emit('server_username',listuser);    
            i++;
        }
    });
    socket.on('client_input_question',function(data){
        let flag=0;
        for(let i = 0;i<listquestions.length;i++){
            if(data.input===listquestions[i]){
                listquestions.splice(i,1); //remove question
                if(listquestions.length===0){ //update listquestions
                    listquestions=ListQuestions();
                }
                for(let j=0;j<listuser.length;j++){
                    if(listuser[j].id===data.id){
                        listuser[j].score+=10;
                    }
                }
                io.emit('server_listquestions',listquestions);
                UpdateRank(listuser);
                io.emit('server_username',listuser);
                flag=1;
                break;
            } 
        }
        if(flag===0){
            for(let j=0;j<listuser.length;j++){
                if(listuser[j].id===data.id){
                    if(listuser[j].score>0){
                        listuser[j].score-=10;
                    }
                }
            }
            io.emit('server_listquestions',listquestions);
            UpdateRank(listuser);
            io.emit('server_username',listuser);
        }
    });
    socket.on('exit',function(data){
        for(let j=0;j<listuser.length;j++){
            if(listuser[j].id===data.id){
                listuser.splice(j,1);
                break;
            }
        }
        io.emit('server_username',listuser);
    });
    socket.on('disconnect',function(){
        var i = listuser.indexOf(socket);
        listuser.splice(i, 1);
        io.emit('server_username',listuser);
    });
});

function User(id,name,score){
    this.id=id;
    this.name=name;
    this.score=score;
};
function randomQuestion(q){
    let c="";
    c=q[Math.floor(Math.random()* (q.length-1))];
    return c;
}
function ListQuestions(){
    let list = [];
    for(let i=0;i<5;i++){
        list.push(randomQuestion(questions));
    }
    return list;
};
function UpdateRank(l){
    l.sort(function(a,b) {return b.score-a.score});
    io.emit('server_username',listuser);
}
// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist/client/public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'dist/client/public/index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port);

console.log(`Password generator listening on ${port}`);