let homepage=document.getElementById("homepage").href;
let mainarticlediv=document.getElementById("mainarticlediv");
let trendarticlediv=document.getElementById("trendarticlediv");
firebase.database().ref('session/').once('value', function(snapshot) {
    let tophtml = ``;
    let feturehtml = ``;
    snapshot.forEach(function(childSnapshot) {
        let discription = childSnapshot.val().discription;
        let title = childSnapshot.val().title;
        let expiredate = childSnapshot.val().expiredate;
        let id = childSnapshot.val().id;
        let imageurl = childSnapshot.val().imageurl;
        let sdis=discription.slice(0, 60) 
        sdis+="..."
        mainarticleurl=homepage+"q/?q="+id;

        var tags=childSnapshot.val().offerlink;
        tags=tags.toUpperCase();
        let myArr = tags.split(",");

        if(myArr.includes("DELETE")==false){
            if(myArr.includes("TREND")){
                feturehtml+=`
                <div class="col-sm-6">
                <div class="card">
                    <div class="row">
                        <div class="col-md-5 wrapthumbnail">
                            <a href="`+mainarticleurl+`">
                            <div class="thumbnail" style="background-image:url(`+imageurl+`);">
                            </div>
                            </a>
                        </div>
                        <div class="col-md-7">
                            <div class="card-block">
                                <h2 class="card-title"><a href="`+mainarticleurl+`">`+title+`</a></h2>
                                <h4 class="card-text">`+sdis+`</h4>
                                <div class="metafooter">
                                    <div class="wrapfooter">
                                        <span class="meta-footer-thumb">
                                        <img class="author-thumb" src="./assets/images/author.png" alt="Author">
                                        </span>
                                        <span class="author-meta">
                                        <span class="post-name"><a>Upload Date</a></span><br/>
                                        <span class="post-date">`+expiredate+`</span>
                                        </span>
                                        <span class="post-read-more"><a  title="`+myArr+`"><i class="fa fa-link"></i></a></span>
                                        <div class="clearfix">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                `;
            }

            if(myArr.includes("TOP")){
                tophtml+=`
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
                                <img class="author-thumb" src="./assets/images/author.png" alt="Upload date">
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

        }

    });
    if(feturehtml==``){
        feturehtml=`No Story found regarding this category`;
    }
    if(tophtml==``){
        tophtml=`No Story found regarding this category`;
    }
    trendarticlediv.innerHTML=feturehtml;
    mainarticlediv.innerHTML=tophtml;
});