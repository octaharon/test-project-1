import React from 'react';
import expect from 'expect';
import ReactTestUtils from 'react-dom/test-utils';
import ConsoleHelper from './console-helper';
import TestHelper from './test-helpers';
import GroupList from '../GroupList';
import MatchGroup from '../MatchGroup';


describe("GroupList", function () {

    let customUUID = "abcdef12-3456-7890-abcd-ef1234567890";

    let mockResponseData = {
        "userId": customUUID,
        "info": {
            "email": "email@example.com",
            "firstName": "first name",
            "lastName": "last name"
        },
        "twitterMatchGroups": [
            {
                "name": "twitter group",
                "influencers": [
                    "twitter_influencer"
                ],
                "keywords": [
                    "twitter keyword"
                ]
            },
            {
                "name": "shared group",
                "influencers": [
                    "twitter_influencer_shared"
                ],
                "keywords": [
                    "twitter shared keyword",
                    "shared keyword"
                ]
            }
        ],
        "instagramMatchGroups": [
            {
                "name": "instagram group",
                "influencers": [
                    "instagram_influencer"
                ],
                "keywords": [
                    "instagram keyword"
                ]
            },
            {
                "name": "shared group",
                "influencers": [
                    "instagram_influencer_shared"
                ],
                "keywords": [
                    "instagram shared keyword",
                    "shared keyword"
                ]
            }
        ]
    };
    let compareRequestData;
    let validateConsoleErrors = false;
    let mockApi = {
        one: (path, uuid) => {
            expect(path).toEqual('userconfig');
            expect(uuid).toEqual(customUUID);
            return {
                put: (data) => {
                    if (compareRequestData instanceof Function)
                        compareRequestData(data);
                    return Promise.resolve({
                        statusCode: () => 204,
                        body: () => {
                            return {
                                data: () => ''
                            }
                        },
                        headers: () => []
                    });
                },
                get: () => {
                    return Promise.resolve({
                        statusCode: () => 200,
                        body: () => {
                            return {
                                data: function () {
                                    return JSON.parse(JSON.stringify(mockResponseData));
                                }
                            }
                        },
                        headers: () => []
                    });
                }
            }
        }
    };

    let hooks = {
        onAfterSave: expect.createSpy(),
        onAfterLoad: expect.createSpy()
    };

    let subject;
    let component;
    let autosaveHook;

    TestHelper.stubComponent(MatchGroup);

    GroupList.prototype.componentDidMount = GroupList.prototype.componentDidMount.wrap(function (originalMethod) {
        this.api = mockApi;
        originalMethod();
    });

    GroupList.prototype.onApiLoad = GroupList.prototype.onApiLoad.wrap(function (originalMethod, response) {
        originalMethod(response);
        if (this.afterloadCallback instanceof Function)
            this.afterloadCallback(this);
    });

    GroupList.prototype.onApiUpdate = GroupList.prototype.onApiUpdate.wrap(function (originalMethod, response) {
        originalMethod(response);
        if (this.aftersaveCallback instanceof Function)
            this.aftersaveCallback(this);
    });

    class GroupListWrapper extends React.Component {
        constructor(props) {
            super(props);
        }

        cmpLoaded(component) {
            if (component) {
                component.afterloadCallback = this.props.loadCb;
                component.aftersaveCallback = this.props.saveCb;
            }
        }

        render() {
            return <GroupList UUID={customUUID} ref={this.cmpLoaded.bind(this)}/>
        }
    }

    beforeEach(() => {
        ConsoleHelper.watchConsole();
    });

    describe("validates proptypes", function () {
        it("and renders correctly", function () {
            validateConsoleErrors = false;
            subject = ReactTestUtils.renderIntoDocument(<GroupList/>);
            let propWarns = ConsoleHelper.getPropWarnings();
            expect(propWarns).toInclude('UUID');
            expect(subject).toExist();
        });
    });

    describe("with data", function () {
        let endTest = null;
        let subject, component;
        validateConsoleErrors = true;

        beforeEach((done) => {
            compareRequestData = null;
            ConsoleHelper.watchConsole();
            hooks.onAfterLoad = cmp => {
                expect(cmp.state).toInclude({
                    twitterGroups: mockResponseData.twitterMatchGroups,
                    instagramGroups: mockResponseData.instagramMatchGroups
                });
                done();
            };
            hooks.onAfterSave = function () {
                if (endTest instanceof Function)
                    endTest()
            };
            subject = ReactTestUtils.renderIntoDocument(<GroupListWrapper
                UUID={customUUID}
                saveCb={hooks.onAfterSave}
                loadCb={hooks.onAfterLoad}
            />);
            component = ReactTestUtils.findRenderedComponentWithType(subject, GroupList);
            autosaveHook = expect.spyOn(component, 'autosave').andCallThrough();
        });

        it("renders correctly", function () {
            expect(ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-header')).toExist();
            let form = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-new');
            expect(form).toExist();
            form = form.querySelector('form');
            expect(form).toExist();
            expect(form.querySelectorAll('input').length).toEqual(2);
            let buttons = form.querySelectorAll('a.fa');
            expect(buttons.length).toEqual(2);
            let groups = ReactTestUtils.scryRenderedComponentsWithType(component, MatchGroup);
            expect(groups.length).toEqual(3);
        });

        it("merges correctly", function () {
            let mergedGroups = component.getMergedGroups();
            endTest = null;
            expect(mergedGroups.length).toEqual(3);
            expect(mergedGroups).toInclude({
                name: 'twitter group',
                twitterList: ['twitter_influencer'],
                instagramList: [],
                keywords: ['twitter keyword']
            }).toInclude({
                name: 'instagram group',
                twitterList: [],
                instagramList: ['instagram_influencer'],
                keywords: ['instagram keyword']
            }).toInclude({
                name: 'shared group',
                twitterList: ["twitter_influencer_shared"],
                instagramList: ["instagram_influencer_shared"],
                keywords: ["instagram shared keyword", "shared keyword", "twitter shared keyword"]
            });
        });

        it("updates correctly instagram-only group", function (done) {
            endTest = done;
            compareRequestData = (data) => {
                expect(data).toEqual({
                    twitterMatchGroups: [
                        {
                            "name": "twitter group",
                            "influencers": [
                                "twitter_influencer"
                            ],
                            "keywords": [
                                "twitter keyword"
                            ]
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "twitter_influencer_shared"
                            ],
                            "keywords": [
                                "twitter shared keyword",
                                "shared keyword"
                            ]
                        }
                    ],
                    instagramMatchGroups: [
                        {
                            "name": "instagram group rename",
                            "influencers": [
                                "instagram_influencer_2"
                            ],
                            "keywords": [
                                "instagram keyword", "instagram keyword 2"
                            ]
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "instagram_influencer_shared"
                            ],
                            "keywords": [
                                "instagram shared keyword",
                                "shared keyword"
                            ]
                        }
                    ]
                });
            };
            component.updateGroup("instagram group", {
                name: "instagram group rename",
                twInfluencers: [],
                igInfluencers: ["instagram_influencer_2"],
                keywords: ['instagram keyword', 'instagram keyword 2']
            });
            expect(component.state.instagramGroups.length).toEqual(2);
            expect(component.state.instagramGroups).toInclude({
                name: 'instagram group rename',
                influencers: ['instagram_influencer_2'],
                keywords: ['instagram keyword', 'instagram keyword 2']
            });
            expect(autosaveHook).toHaveBeenCalled();
        });

        it("updates correctly twitter-only group", function (done) {
            endTest = done;
            compareRequestData = (data) => {
                expect(data).toEqual({
                    instagramMatchGroups: [
                        {
                            "name": "instagram group",
                            "influencers": [
                                "instagram_influencer"
                            ],
                            "keywords": [
                                "instagram keyword"
                            ]
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "instagram_influencer_shared"
                            ],
                            "keywords": [
                                "instagram shared keyword",
                                "shared keyword"
                            ]
                        }
                    ],
                    twitterMatchGroups: [
                        {
                            "name": "twitter group rename",
                            "influencers": [
                                "twitter_influencer_2"
                            ],
                            "keywords": [
                                'twitter keyword',
                                'twitter keyword 2'
                            ]
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "twitter_influencer_shared"
                            ],
                            "keywords": [
                                "twitter shared keyword",
                                "shared keyword"
                            ]
                        }]
                });
            };
            component.updateGroup("twitter group", {
                name: "twitter group rename",
                twInfluencers: ["twitter_influencer_2"],
                igInfluencers: [],
                keywords: ['twitter keyword', 'twitter keyword 2']
            });
            expect(component.state.twitterGroups.length).toEqual(2);
            expect(component.state.twitterGroups).toInclude({
                name: 'twitter group rename',
                influencers: ['twitter_influencer_2'],
                keywords: ['twitter keyword', 'twitter keyword 2']
            });
            expect(autosaveHook).toHaveBeenCalled();

        });

        it("updates correctly shared group", function (done) {
            endTest = done;
            let sharedKeywords = ['twitter keyword 2', 'instagram keyword 2', 'shared keyword 2', 'shared keyword'];
            compareRequestData = (data) => {
                expect(data).toEqual({
                    instagramMatchGroups: [
                        {
                            "name": "instagram group",
                            "influencers": [
                                "instagram_influencer"
                            ],
                            "keywords": [
                                "instagram keyword"
                            ]
                        },
                        {
                            "name": "shared group 2",
                            "influencers": [
                                "instagram_influencer_2"
                            ],
                            "keywords": sharedKeywords
                        }
                    ],
                    twitterMatchGroups: [
                        {
                            "name": "twitter group",
                            "influencers": [
                                "twitter_influencer"
                            ],
                            "keywords": [
                                'twitter keyword'
                            ]
                        },
                        {
                            "name": "shared group 2",
                            "influencers": [
                                "twitter_influencer_2"
                            ],
                            "keywords": sharedKeywords
                        }]
                });
            };
            component.updateGroup("shared group", {
                name: "shared group 2",
                twInfluencers: ["twitter_influencer_2"],
                igInfluencers: ["instagram_influencer_2"],
                keywords: sharedKeywords
            });
            expect(autosaveHook).toHaveBeenCalled();

        });

        it("updates correctly twitter group into shared", function (done) {
            endTest = done;
            let sharedKeywords = ['twitter shared keyword', 'instagram shared keyword'];
            compareRequestData = (data) => {
                expect(data).toEqual({
                    instagramMatchGroups: [
                        {
                            "name": "instagram group",
                            "influencers": [
                                "instagram_influencer"
                            ],
                            "keywords": [
                                "instagram keyword"
                            ]
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "instagram_influencer_shared"
                            ],
                            "keywords": [
                                "instagram shared keyword",
                                "shared keyword"
                            ]
                        },
                        {
                            "name": "shared twitter group",
                            "influencers": [
                                "twitter_to_instagram_influencer"
                            ],
                            "keywords": sharedKeywords
                        }
                    ],
                    twitterMatchGroups: [
                        {
                            "name": "shared twitter group",
                            "influencers": [
                                "twitter_influencer"
                            ],
                            "keywords": sharedKeywords
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "twitter_influencer_shared"
                            ],
                            "keywords": [
                                "twitter shared keyword",
                                "shared keyword"
                            ]

                        }
                    ]
                });
            };
            component.updateGroup("twitter group", {
                name: "shared twitter group",
                twInfluencers: ["twitter_influencer"],
                igInfluencers: ["twitter_to_instagram_influencer"],
                keywords: sharedKeywords
            });
            expect(autosaveHook).toHaveBeenCalled();

        });

        it("updates correctly instagram group into shared", function (done) {
            endTest = done;
            let sharedKeywords = ['twitter shared keyword', 'instagram shared keyword'];
            compareRequestData = (data) => {
                expect(data).toEqual({
                    instagramMatchGroups: [
                        {
                            "name": "shared instagram group",
                            "influencers": [
                                "instagram_influencer"
                            ],
                            "keywords": sharedKeywords
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "instagram_influencer_shared"
                            ],
                            "keywords": [
                                "instagram shared keyword",
                                "shared keyword"
                            ]
                        },
                    ],
                    twitterMatchGroups: [
                        {
                            "name": "twitter group",
                            "influencers": [
                                "twitter_influencer"
                            ],
                            "keywords": [
                                "twitter keyword"
                            ]
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "twitter_influencer_shared"
                            ],
                            "keywords": [
                                "twitter shared keyword",
                                "shared keyword"
                            ]

                        },
                        {
                            "name": "shared instagram group",
                            "influencers": [
                                "instagram_to_twitter_influencer"
                            ],
                            "keywords": sharedKeywords
                        }
                    ]
                });
            };
            component.updateGroup("instagram group", {
                name: "shared instagram group",
                twInfluencers: ["instagram_to_twitter_influencer"],
                igInfluencers: ["instagram_influencer"],
                keywords: sharedKeywords
            });
            expect(autosaveHook).toHaveBeenCalled();

        });

        it("deletes correctly twitter-only group", function (done) {
            endTest = done;
            compareRequestData = (data) => {
                expect(data).toEqual({
                    instagramMatchGroups: [
                        {
                            "name": "instagram group",
                            "influencers": [
                                "instagram_influencer"
                            ],
                            "keywords": [
                                "instagram keyword"
                            ]
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "instagram_influencer_shared"
                            ],
                            "keywords": [
                                "instagram shared keyword",
                                "shared keyword"
                            ]
                        }
                    ],
                    twitterMatchGroups: [
                        {
                            "name": "shared group",
                            "influencers": [
                                "twitter_influencer_shared"
                            ],
                            "keywords": [
                                "twitter shared keyword",
                                "shared keyword"
                            ]
                        }]
                });
            };
            component.onGroupDelete('twitter group');
            expect(autosaveHook).toHaveBeenCalled();
        });

        it("deletes correctly instagram-only group", function (done) {
            endTest = done;
            compareRequestData = (data) => {
                expect(data).toEqual({
                    instagramMatchGroups: [
                        {
                            "name": "shared group",
                            "influencers": [
                                "instagram_influencer_shared"
                            ],
                            "keywords": [
                                "instagram shared keyword",
                                "shared keyword"
                            ]
                        }
                    ],
                    twitterMatchGroups: [
                        {
                            "name": "twitter group",
                            "influencers": [
                                "twitter_influencer"
                            ],
                            "keywords": [
                                "twitter keyword"
                            ]
                        },
                        {
                            "name": "shared group",
                            "influencers": [
                                "twitter_influencer_shared"
                            ],
                            "keywords": [
                                "twitter shared keyword",
                                "shared keyword"
                            ]
                        }]
                });
            };
            component.onGroupDelete('instagram group');
            expect(autosaveHook).toHaveBeenCalled();
        });

        it("deletes correctly shared group", function (done) {
            endTest = done;
            compareRequestData = (data) => {
                expect(data).toEqual({
                    instagramMatchGroups: [
                        {
                            "name": "instagram group",
                            "influencers": [
                                "instagram_influencer"
                            ],
                            "keywords": [
                                "instagram keyword"
                            ]
                        }
                    ],
                    twitterMatchGroups: [
                        {
                            "name": "twitter group",
                            "influencers": [
                                "twitter_influencer"
                            ],
                            "keywords": [
                                "twitter keyword"
                            ]
                        }]
                });
            };
            component.onGroupDelete('shared group');
            expect(autosaveHook).toHaveBeenCalled();
        });

        describe("new group", function () {
            let mockGroup = {
                name: 'new group',
                influencer: 'influencer_test'
            };
            it("validates invalid input", function () {
                let form = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-new');
                form = form.querySelector('form');
                let inputs = form.querySelectorAll('input');

                inputs[0].value = mockGroup.name;
                ReactTestUtils.Simulate.change(inputs[0]);
                expect(form.querySelector('a.fa-plus-circle')).toNotExist();

                ReactTestUtils.Simulate.keyDown(form, {key: "Enter", keyCode: 13, which: 13});
                expect(autosaveHook).toNotHaveBeenCalled();

                inputs[0].value = '';
                ReactTestUtils.Simulate.change(inputs[0]);
                inputs[1].value = mockGroup.influencer;
                ReactTestUtils.Simulate.change(inputs[1]);
                expect(form.querySelector('a.fa-plus-circle')).toNotExist();
                ReactTestUtils.Simulate.keyDown(form, {key: "Enter", keyCode: 13, which: 13});
                expect(autosaveHook).toNotHaveBeenCalled();

            });

            it("changes group type", function () {
                let form = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-new');
                form = form.querySelector('form');
                let buttons = form.querySelectorAll('a.fa');
                let groupTypeSpan = form.querySelector('label span');

                expect(groupTypeSpan).toExist();

                ReactTestUtils.Simulate.click(buttons[0]);
                expect(groupTypeSpan.textContent.trim()).toEqual('Twitter');
                expect(component.state.newGroupInfluencerType).toEqual('twitter');

                ReactTestUtils.Simulate.click(buttons[1]);
                expect(groupTypeSpan.textContent.trim()).toEqual('Instagram');
                expect(component.state.newGroupInfluencerType).toEqual('instagram');

            });

            it("adds twitter group with button", function (done) {
                endTest = done;
                compareRequestData = (data) => {
                    expect(data).toEqual({
                        "twitterMatchGroups": [
                            {
                                "name": "twitter group",
                                "influencers": [
                                    "twitter_influencer"
                                ],
                                "keywords": [
                                    "twitter keyword"
                                ]
                            },
                            {
                                "name": "shared group",
                                "influencers": [
                                    "twitter_influencer_shared"
                                ],
                                "keywords": [
                                    "twitter shared keyword",
                                    "shared keyword"
                                ]
                            },
                            {
                                name: mockGroup.name,
                                influencers: [mockGroup.influencer],
                                keywords: []
                            }
                        ],
                        "instagramMatchGroups": [
                            {
                                "name": "instagram group",
                                "influencers": [
                                    "instagram_influencer"
                                ],
                                "keywords": [
                                    "instagram keyword"
                                ]
                            },
                            {
                                "name": "shared group",
                                "influencers": [
                                    "instagram_influencer_shared"
                                ],
                                "keywords": [
                                    "instagram shared keyword",
                                    "shared keyword"
                                ]
                            }
                        ]
                    });
                };

                let form = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-new');
                form = form.querySelector('form');
                let inputs = form.querySelectorAll('input');
                let buttons = form.querySelectorAll('a.fa');

                inputs[0].value = mockGroup.name;
                ReactTestUtils.Simulate.change(inputs[0]);
                inputs[1].value = mockGroup.influencer;
                ReactTestUtils.Simulate.change(inputs[1]);

                ReactTestUtils.Simulate.click(buttons[0]);

                expect(form.querySelector('a.fa-plus-circle')).toExist();
                ReactTestUtils.Simulate.click(form.querySelector('a.fa-plus-circle'));

                expect(autosaveHook).toHaveBeenCalled();
            });

            it("adds instagram group with enter", function (done) {
                endTest = done;
                compareRequestData = (data) => {
                    expect(data).toEqual({
                        "twitterMatchGroups": [
                            {
                                "name": "twitter group",
                                "influencers": [
                                    "twitter_influencer"
                                ],
                                "keywords": [
                                    "twitter keyword"
                                ]
                            },
                            {
                                "name": "shared group",
                                "influencers": [
                                    "twitter_influencer_shared"
                                ],
                                "keywords": [
                                    "twitter shared keyword",
                                    "shared keyword"
                                ]
                            }

                        ],
                        "instagramMatchGroups": [
                            {
                                "name": "instagram group",
                                "influencers": [
                                    "instagram_influencer"
                                ],
                                "keywords": [
                                    "instagram keyword"
                                ]
                            },
                            {
                                "name": "shared group",
                                "influencers": [
                                    "instagram_influencer_shared"
                                ],
                                "keywords": [
                                    "instagram shared keyword",
                                    "shared keyword"
                                ]
                            },
                            {
                                name: mockGroup.name,
                                influencers: [mockGroup.influencer],
                                keywords: []
                            }
                        ]
                    });
                };

                let form = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-new');
                form = form.querySelector('form');
                let inputs = form.querySelectorAll('input');
                let buttons = form.querySelectorAll('a.fa');

                inputs[0].value = mockGroup.name;
                ReactTestUtils.Simulate.change(inputs[0]);
                inputs[1].value = mockGroup.influencer;
                ReactTestUtils.Simulate.change(inputs[1]);

                ReactTestUtils.Simulate.click(buttons[1]);

                ReactTestUtils.Simulate.keyDown(form, {key: "Enter", keyCode: 13, which: 13});
                expect(autosaveHook).toHaveBeenCalled();
            });
        });

    });


    afterEach(() => {
        let propWarns = ConsoleHelper.getErrors();
        if (validateConsoleErrors)
            expect(propWarns.length).toEqual(0);
        expect.restoreSpies();
    });
});