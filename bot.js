const puppeteer = require('puppeteer-core'),
    config = require('./config'),
    shuffle = require('shuffle-array');


async function loginAndLoadHomePage(page) {
    await page.setViewport({width: 1200, height: 764});
    await page.goto(config.base_url, {
        timeout: 60000
    });
    await page.waitFor(2500);

    /* Click on the username field using the field selector*/
    await page.click(config.selectors.username_field);
    await page.keyboard.type(config.username);
    await page.click(config.selectors.password_field);
    await page.keyboard.type(config.password);
    await page.click(config.selectors.login_button);
    await page.waitForNavigation();
    //Close Turn On Notification modal after login
    if (await page.$(config.selectors.not_now_button) !== null) {
        console.log('notification dialog found --- clicking .. ');
        await page.click(config.selectors.not_now_button);
    } else console.log('notification dialog not found --- not clicking! :/ passing it so ... ');

    console.log('home page loaded!!');
    return true;
}

async function fetchInstagram() {
    // const today = new Date(), hashTags = [1, 41, 481, 12, 71, 19];
    let pouchDb = require('./pouchDb');
    pouchDb.initDbs(new Date());

    await pouchDb.total.initTotal().then(() => {
        console.log('total init done.');
    }).catch((er) => console.log(er));
    let totalActions = 0;
    await pouchDb.total.getTotal().then(t => totalActions = t.count).catch((e) => {
        totalActions = 0;
        console.log(e)
    });

    console.log(totalActions);

    let likesCount = 0, commentsCount = 0, followsCount = 0, totalPerHour = likesCount + commentsCount + followsCount,
        maxH = config.settings.hourly_max_actions - 3, canYouThisHour = totalPerHour < maxH;


    if (totalActions < config.settings.daily_max_actions) {
        const browser = await puppeteer.launch({
	    executablePath: 'chromium-browser',
            headless: true,
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        let loaded;
        await loginAndLoadHomePage(page).then(value => loaded = value).catch(() => loaded = false);

        let hashTags = shuffle(config.hashTags);
        if (loaded)
            for (let hash = 0; hash < hashTags.length; hash++) {
                await page.goto(config.search_url + hashTags[hash] + '/?hl=en');
                console.log('searching for hashTag : ' + hashTags[hash]);

                // Loop through the latest 9 posts
                for (let r = 1; r < 7; r++) {
                    for (let c = 1; c < 4; c++) { // should be 4 !!
                        //Try to select post, wait, if successful continue
                        let br = false;
                        await page.click('section > main > article > div:nth-child(3) > div > div:nth-child(' + r + ') > div:nth-child(' + c + ') > a').catch(() => {
                            br = true;
                        });
                        await page.waitFor(2250 + Math.floor(Math.random() * 250));
                        if (br) {
                            console.log('couldn\'t selecte post ' + r + ' / ' + c);
                            continue;
                        } else
                            console.log('selected post ' + hashTags[hash] + ' ' + r + ' / ' + c);

                        let username = await page.evaluate(x => {
                            let element = document.querySelector(x);
                            return Promise.resolve(element ? element.innerHTML : '');
                        }, config.selectors.post_username);

                        if (username !== 'bornvegan10') {
                            let followStatus = await page.evaluate(x => {
                                let element = document.querySelector(x);
                                return Promise.resolve(element ? element.innerHTML : '');
                            }, config.selectors.post_follow_link);

                            // Get post info
                            let hasEmptyHeart = await page.$(config.selectors.post_heart_grey);

                            console.log(`Evaluated post from ${username} ====> ${followStatus === 'Follow' ? 'not' : ''} followed // ${hasEmptyHeart ? 'not' : ''} liked! \n`);

                            await pouchDb.like.getCountLikes().then(l => likesCount = l ? l.doc_count : 0).catch(r => console.log(r));
                            await pouchDb.comment.getCountComments().then(c => commentsCount = c ? c.doc_count : 0).catch(r => console.log(r));
                            await pouchDb.follow.getCountFollow().then(f => followsCount = f ? f.doc_count : 0).catch(r => console.log(r));

                            console.log(totalPerHour, likesCount, commentsCount, followsCount, maxH, canYouThisHour);
                            // Decide to follow user
                            // let isArchivedUser;
                            // await ops.inArchive(username).then(() => isArchivedUser = true).catch(() => isArchivedUser = false);
                            console.log('----------------EXECUTING FOLLOWING------------------\n');

                            if (followStatus === 'Follow' && Math.random() < config.settings.follow_ratio && followsCount < config.settings.hourly_max_follows && canYouThisHour) {
                                await page.click(config.selectors.post_follow_link);
                                // if (followStatus !== 'Follow')
                                console.log('---> followed ' + username);

                                await pouchDb.follow.addFollow(username).then(done => console.log('saved follow!')).catch(err => console.log(err))
                                await pouchDb.follow.getCountFollow().then(f => followsCount = f.doc_count);

                                totalActions++;

                                totalPerHour = likesCount + commentsCount + followsCount;
                                canYouThisHour = totalPerHour < maxH;
                                await page.waitFor(10000 + Math.floor(Math.random() * 5000));
                            }

                            console.log('----------------EXECUTING COMMENTING & LIKING------------------\n');

                            // Decide to like post
                            if (hasEmptyHeart !== null && Math.random() < config.settings.like_ratio && canYouThisHour) {
                                if (await page.$(config.selectors.post_like_button) !== null && likesCount < config.settings.hourly_max_likes) {
                                    await page.click(config.selectors.post_like_button);
                                    console.log('---> like for ' + username);

                                    await pouchDb.like.addLike(username).then(done => console.log('saved like!')).catch(err => console.log(err));
                                    await pouchDb.like.getCountLikes().then(c => likesCount = c.doc_count).catch(err => console.log(err));

                                    totalActions++;

                                    totalPerHour = likesCount + commentsCount + followsCount;
                                    canYouThisHour = totalPerHour < maxH;

                                    await page.waitFor(10000 + Math.floor(Math.random() * 5000));
                                }

                                console.log(shuffle(config.comment_contents)[0]);

                                if (await page.$(config.selectors.comment_field) !== null)
                                    await page.click(config.selectors.comment_field);

                                await page.keyboard.type(shuffle(config.comment_contents)[0]);

                                if (await page.$(config.selectors.comment_confirm_button) !== null && commentsCount < config.settings.hourly_max_comments && canYouThisHour) {
                                    await page.click(config.selectors.comment_confirm_button);

                                    await pouchDb.comment.addComment(username).then(done => console.log('saved comment!')).catch(err => console.log(err));
                                    await pouchDb.comment.getCountComments().then(c => commentsCount = c.doc_count).catch(err => console.log(err));

                                    totalActions++;

                                    totalPerHour = likesCount + commentsCount + followsCount;
                                    canYouThisHour = totalPerHour < maxH;
                                }

                                await page.waitFor(10000 + Math.floor(Math.random() * 5000));
                            }
                        }

                        await pouchDb.total.addTotal(totalActions).then(value => console.log('count done! - ', value)).catch(r => console.log(r));
                        await pouchDb.total.getTotal().then(t => totalActions = t.count).catch((e) => {
                            totalActions = 0;
                            console.log(e)
                        });

                        console.log('totalActions = ', totalActions, 'daily limit = ', config.settings.daily_max_actions);

                        if (totalActions >= config.settings.daily_max_actions - 20 || !canYouThisHour) {
                            return 'hitting limit! I\'m having a pause! buuut I\'m still working baby! 😁😁😁😁😁😁😁 \n we did ' 
					+ likesCount + ' likes & ' + commentsCount + ' comments & ' + followsCount + ' follows! \n total actions for now = ' 
					+ totalActions + '\n our daily limit = ' + config.settings.daily_max_actions;
                        }
                        // closing post
                        await page.click(config.selectors.post_close_button).catch(() => console.log(':::> Error closing post'));
                    }
                }
            }

        await browser.close();
        return 'cycle ended! still working baby! 😁😁😁😁😁😁😁';
    } else {
        return 'hitting limit! I\'m having a pause! buuut I\'m still working baby! 😁😁😁😁😁😁😁'
    }
}

module.exports = {fetchInstagram};
