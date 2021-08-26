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

class FireUser{

  constructor(){
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
