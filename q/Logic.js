let mainimg=document.getElementById("mainimg");
let title=document.getElementById("title");
let discription=document.getElementById("discription");
let mainimageofferlink=document.getElementById("mainimageofferlink");
let mainyoutubeiframe=document.getElementById("mainyoutubeiframe");
let expiredate=document.getElementById("expiredate");
let stsofex=document.getElementById("stsofex");
let tagsdiv=document.getElementById("tagsdiv");
let msgfromauth=document.getElementById("msgfromauth");

let sharetext="";
let shareurl="";
// FROM URL GET THE ID START HERE
var url_string = window.location.href
var url = new URL(url_string);
var query = url.searchParams.get("q");
if(query==null){
    // location.replace("./../404")
}
// FROM URL GET THE ID END HERE
firebase.database().ref('session/' + query).on('value', function(snapshot) {
    if(snapshot.val()==null){
        // location.replace("./../404")
    }
    else{
        msgfromauth.innerHTML=snapshot.val().msgfromauth;
        mainimg.src=snapshot.val().imageurl;
        title.innerHTML=snapshot.val().title;
        document.title=snapshot.val().title;
        discription.innerHTML=snapshot.val().discription;
        var youurl = new URL(snapshot.val().ytubevdolink);
        var videokeyyoutube = youurl.searchParams.get("v");
        sharetext=title+"- ";
        if(videokeyyoutube!=null){
            document.getElementById("mainyoutubediv").style.display="block";
            mainyoutubeiframe.src=mainyoutubeiframe.src+videokeyyoutube;
        }
        expiredate.innerText=snapshot.val().expiredate;

        var tags=snapshot.val().offerlink;
        tags=tags.toUpperCase();
        let myArr = tags.split(",");
        let ht=`
        <li>
        <a href="./../">Home</a>
        </li>
        <li>
        <a>`+snapshot.val().expiredate+`</a>
        </li>
        `;
        for(let i=0;i<myArr.length;i++){
            ht+=`
            <li>
            <a>`+myArr[i]+`</a>
            </li>
            `;
        }
        tagsdiv.innerHTML=ht;


    }

});

// USEFULL CAT START

firebase.database().ref('session/').once('value', function(snapshot) {
    let feturehtml = ``;
    snapshot.forEach(function(childSnapshot) {
        let title = childSnapshot.val().title;
        let id = childSnapshot.val().id;
        mainarticleurl=homepage+"q/?q="+id;
        var tags=childSnapshot.val().offerlink;
        tags=tags.toUpperCase();
        let myArr = tags.split(",");
        shareurl=mainarticleurl;
        if(myArr.includes("DELETE")==false){
            if(myArr.includes("TREND")){
                feturehtml+=`
                <li><a target="_blank" href="`+mainarticleurl+`">`+title+`</a></li>
                `;
            }

        }

    });
    if(feturehtml==``){
        feturehtml=`No Story found regarding this category`;
    }

    document.getElementById("usefullui").innerHTML=feturehtml;
});

// USEFULL CAT END

function sharethisarticle(){
    if (navigator.share) {
        navigator.share({
            title: 'Share',
                text:sharetext,
                url: shareurl
            }).then(() => {
                // console.log('Thanks for sharing!');
            })
            .catch(err => {
                console.log(`Couldn't share because of some error`);
            });
    } else {
        console.log('Web share not supported');
    }

}