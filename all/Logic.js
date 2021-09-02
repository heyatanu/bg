let homepage=document.getElementById("homepage").href;
let mainarticlediv=document.getElementById("mainarticlediv");

firebase.database().ref('session/').once('value', function(snapshot) {
    let html = ``;
    snapshot.forEach(function(childSnapshot) {
        let discription = childSnapshot.val().discription;
        let title = childSnapshot.val().title;
        let expiredate = childSnapshot.val().expiredate;
        let id = childSnapshot.val().id;
        let imageurl = childSnapshot.val().imageurl;
        let sdis=discription.slice(0, 150) 
        sdis+="..."
        var tags=childSnapshot.val().offerlink;
        tags=tags.toUpperCase();
        let myArr = tags.split(",");
        mainarticleurl=homepage+"q/?q="+id;
        if(myArr.includes("DELETE")==false && myArr.includes("TOP")==false && myArr.includes("TREND")==false){
            html=`
            <div class="col-md-3 grid-item">
            <div class="card">
                <a href="`+mainarticleurl+`">
                <img class="img-fluid" src="`+imageurl+`" alt="Offer Image">
                </a>
                <div class="card-block">
                    <h2 class="card-title"><a href="`+mainarticleurl+`" >`+title+`</a></h2>
                    <h4 class="card-text">`+sdis+`</h4>
                    <div class="metafooter">
                        <div class="wrapfooter">
                            <span class="meta-footer-thumb">
                            <img class="author-thumb" src="././../assets/images/author.png" alt="Upload date">
                            </span>
                            <span class="author-meta">
                            <span class="post-name"><a target="_blank" >Upload Date</a></span><br/>
                            <span class="post-date">`+expiredate+`</span>
                            </span>
                            <span class="post-read-more"><a title="`+myArr+`" ><i class="fa fa-link"></i></a></span>
                            <div class="clearfix">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            `;
        }
    });
    if(html==``){
        html=`No Story found regarding this category.   >>> <br><a href=`+homepage+`>Go TO Home</a>`;
    }
    mainarticlediv.innerHTML=html;
});