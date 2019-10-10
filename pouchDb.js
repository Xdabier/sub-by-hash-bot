let PouchDB = require('pouchdb');

let db_follow;
let db_like;
let db_comment;
let db_total;

let dynamicDate = (dt) => {
    return {
        t: `${dt.getDate()}-${dt.getMonth()}-${dt.getFullYear()}-`,
        hours: `${dt.getDate()}-${dt.getMonth()}-${dt.getFullYear()}-${dt.getHours()}-`
    };
};

const initDbs = (dt) => {
    console.log(`initializing dbs on date = ${dt.toLocaleDateString()} \n and time = ${dt.toTimeString()}`);
    db_follow = new PouchDB(dynamicDate(dt).hours + 'follows');
    db_like = new PouchDB(dynamicDate(dt).hours + 'likes');
    db_comment = new PouchDB(dynamicDate(dt).hours + 'comments');
    db_total = new PouchDB(dynamicDate(dt).t + 'total');
};

const initTotal = async () => {
    db_total.get('likes').then((l) => {
        console.log('current likes = ', l);
    }).catch(function (err) {
        console.log(err);
        db_total.put({
            _id: 'likes',
            count: 0
        }).then(suc => {
            console.log('suc l = ', suc)
        })
    });
    /////////////////////////////////////////////////////////////////
    db_total.get('comments').then((l) => {
        console.log('current comments = ', l);
    }).catch(function (err) {
        console.log(err);
        db_total.put({
            _id: 'comments',
            count: 0
        }).then(suc => {
            console.log('suc c= ', suc)
        })
    });
    /////////////////////////////////////////////////////////////////
    db_total.get('follows').then((l) => {
        console.log('current follows = ', l);
    }).catch(function (err) {
        console.log(err);
        db_total.put({
            _id: 'follows',
            count: 0
        }).then(suc => {
            console.log('suc f = ', suc)
        })
    });
    /////////////////////////////////////////////////////////////////
    db_total.get('all_actions').then((l) => {
        console.log('current total actions = ', l);
    }).catch(function (err) {
        console.log(err);
        db_total.put({
            _id: 'all_actions',
            count: 0
        })
    });
};

// following methods

const addFollow = async function (username) {
    return db_follow.put({_id: 'id' + username, added: new Date().getTime(), h: new Date().getHours().toString()});
};

const getCountFollow = async function () {
    return db_follow.info()
};

// liking methods

const addLike = async function (username) {
    return db_like.put({_id: 'id' + username, added: new Date().getTime(), h: new Date().getHours().toString()});
};

const getCountLikes = async function () {
    return db_like.info()
};

// commenting methods

const addComment = async function (username) {
    return db_comment.put({_id: 'id' + username, added: new Date().getTime(), h: new Date().getHours().toString()});
};

const getCountComments = async function () {
    return db_comment.info()
};

// totals counting methods

// we fetch the total using the already defined get_count method, then look if there's a [_rev], if so we add it to update, else we add new
// follows case here
const getThenAddFollowsToTotal = async function (objectWithRev) {
    return getCountFollow().then((val) => {
        if (val && val.doc_count > 0)
            objectWithRev['count'] += val.doc_count;
        return db_total.put(objectWithRev, {force: true});
    }).catch(function (err) {
        console.log(err);
    });
};

// this kind of method will only be called after we do the specific action. "follow or like or comment"
const addTotalFollowers = async function () {
    let object = {_id: 'follows', count: 0};

    return db_total.get('follows').then((doc) => {
        // in case of it exists it updates using the _rev
        if (doc && doc._rev) {
            object['_rev'] = doc._rev;
            object['count'] += doc.count;
        }
        return getThenAddFollowsToTotal(object).then((res) => {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        });
    }).catch(function (err) {
        console.log(err);
        // in case of it doesn't exist it adds whats there.
        return getThenAddFollowsToTotal(object).then((res) => {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        });
    });
};

// likes case here
const getThenAddLikesToTotal = async function (objectWithRev) {
    return getCountLikes().then((val) => {
        if (val && val.doc_count > 0)
            objectWithRev['count'] += val.doc_count;
        return db_total.put(objectWithRev);
    }).catch(function (err) {
        console.log(err);
    });
};

const addTotalLikes = async function () {
    let object = {_id: 'likes', count: 0};

    return db_total.get('likes').then((doc) => {
        if (doc && doc._rev) {
            object['_rev'] = doc._rev;
            object['count'] += doc.count;
        }
        return getThenAddLikesToTotal(object).then((res) => {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        });
    }).catch(function (err) {
        console.log(err);

        return getThenAddLikesToTotal(object).then((res) => {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        });
    });
};

// comments case here
const getThenAddCommentsToTotal = async function (objectWithRev) {
    return getCountComments().then((val) => {
        if (val && val.doc_count > 0)
            objectWithRev['count'] += val.doc_count;
        return db_total.put(objectWithRev);
    }).catch(function (err) {
        console.log(err);
    });
};

const addTotalComments = async function () {
    let object = {_id: 'comments', count: 0};

    return db_total.get('comments').then((doc) => {
        if (doc && doc._rev) {
            object['_rev'] = doc._rev;
            object['count'] += doc.count;
        }

        return getThenAddCommentsToTotal(object).then((res) => {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        });
    }).catch(function (err) {
        console.log(err);

        return getThenAddCommentsToTotal(object).then((res) => {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        });
    });
};

// counting all total

const countAllTotal = async function () {
    return getTotalLikes().then(likes => {
        let lk = likes ? likes.count : 0;
        return getTotalComments().then(comments => {
            let cm = comments ? comments.count : 0;
            return getTotalFollows().then(follows => {
                let fl = follows ? follows.count : 0;
                return db_total.get('all_actions').then(all => {
                    return db_total.put({
                        _id: 'all_actions',
                        _rev: all._rev,
                        count: fl + cm + lk
                    })
                }).catch(function (err) {
                    console.log(err);
                    return db_total.put({
                        _id: 'all_actions',
                        count: fl + cm + lk
                    })
                });
            })
        })
    })
};

const addTotal = async function (count) {
    return db_total.get('all_actions').then((doc) => {
        return db_total.put({_id: 'all_actions', count, _rev: doc._rev});
    });
};

const getTotalFollows = async () => {
    return db_total.get('follows');
};

const getTotalLikes = async () => {
    return db_total.get('likes');
};

const getTotalComments = async () => {
    return db_total.get('comments');
};

const getTotal = async () => {
    return db_total.get('all_actions');
};

module.exports = {
    initDbs,
    follow: {
        addFollow,
        getCountFollow
    },
    like: {
        addLike,
        getCountLikes
    },
    comment: {
        addComment,
        getCountComments
    },
    total: {
        addTotalComments,
        addTotalFollowers,
        addTotalLikes,
        getTotalFollows,
        getTotalComments,
        getTotalLikes,
        getTotal,
        countAllTotal,
        initTotal,
        addTotal
    }
};
