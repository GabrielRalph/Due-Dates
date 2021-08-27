import {addProps} from "../SvgJSON/SvgJSON.js"

let ProjectRef = "dueDates/"
let UsersRef = ProjectRef + "users/"
let UserProps = {
  displayName: {
    type: "string",
  },
  photoURL: {
    type: "string",
  },
  email: {
    type: "string",
  },
  uid: {
    type: "string",
  }
};

let NewViewTime = 1000*60*60;

class FireUser{

  constructor(){


    if (this.isViewed) {
      console.log("viewed ");
    }else {
      console.log("new view");
      document.viewed();
      this.updateViews();
    }

    if (this.isRecentView) {
      this.updateViews("total-views");
      document.timeViewed();
    }
  }

  get isRecentView(){
    let cookies = document.cookie + "";
    const match = cookies.match(/timeViewed=(\d*);/);
    let viewed = false;
    if (match != null){
      let time = parseInt(match[1]);
      let deltaTime = (new Date()).getTime() - time;
      if (deltaTime > NewViewTime) {
        return true;
      }
    }else {
      return true;
    }
    return false;
  }


  get isViewed(){
    let cookies = document.cookie + "";
    const match = cookies.match(/viewed=(\d);/);
    let viewed = false;
    if (match != null){
      return 1 == parseInt(match[1]);
    }
    return false;
  }

  async updateViews(val = "views"){
    let ref = firebase.database().ref("dueDates/" + val);

    let nv = (await ref.once("value")).val();
    nv = nv == null ? 1 : nv + 1;
    console.log(`${val}: ${nv}`);
    ref.set(nv);
  }

  watch(){
    firebase.auth().onAuthStateChanged((userData) => {
      if (userData == null) {
        if (this.onuserleave instanceof Function) {
          this.onuserleave();
        }
      } else {
        let user = this.parseUser(userData);
        // firebase.database().ref(UsersRef + user.uid).update(user);
        if (this.onuser instanceof Function) {
          this.onuser(user);
        }
      }
    });
  }

  parseUser(userData) {
    let user = {};
    addProps(UserProps, userData, user);
    return user.json;
  }

  signIn(){
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  }

  signOut(){
    firebase.auth().signOut();
  }
}

export {FireUser, UserProps}
