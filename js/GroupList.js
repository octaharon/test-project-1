require('../sass/GroupList.scss');

import React from 'react';
import _ from 'underscore';
import update from 'immutability-helper';
import PropTypes from 'prop-types';
import API from './API';
import MatchGroup from './MatchGroup';


const propTypes = {
    UUID: PropTypes.string
};

/**
 * @property UUID
 */
class GroupList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newGroupName: '',
            newGroupInfluencer: '',
            newGroupInfluencerType: 'twitter',
            canAdd: false,
            twitterGroups: [],
            instagramGroups: []
        };
        this.api = API;
        this.autosave = this.autosave.bind(this);
    }

    componentDidMount() {
        if (this.props.UUID)
            this.loadData(this.props.UUID);
    }

    componentWillReceiveProps(nextProps) {
        let UUID = nextProps.UUID;
        if (UUID && UUID != this.props.UUID)
            this.loadData(UUID);
    }

    loadData(UUID) {
        this.api.one('userconfig', UUID).get().then((response) => {
            let data = response.body().data();
            console.log(data);
            this.setState({
                twitterGroups: data.twitterMatchGroups || [],
                instagramGroups: data.instagramMatchGroups || []
            });

        }).catch((err) => {
            console.log(err);
            alert("Connection error");
        });
    }


    autosave() {
        if (!this.props.UUID)
            return false;
        let data = {
            twitterMatchGroups: this.state.twitterGroups,
            instagramMatchGroups: this.state.instagramGroups
        };
        this.api.one('userconfig', this.props.UUID).put(data).then(function (response) {
            console.log('saved');
            debugger;
        }.bind(this)).catch((err) => {
            console.log(err);
            alert("Connection error");
        });
    }

    updateGroup(groupName, newData = null) {
        newData.name = newData.name.trim();
        if (!newData.name.length)
            return false;
        let twGroup = _.findWhere(this.state.twitterGroups, {name: groupName});
        let igGroup = _.findWhere(this.state.instagramGroups, {name: groupName});
        let toChange = {};
        //the first clause of this condition will never trigger for users created via this app but can be useful for managing existing data
        if (twGroup === undefined) {
            if (newData.twInfluencers instanceof Array && newData.twInfluencers.length) {
                twGroup = {
                    name: newData.name,
                    influencers: newData.twInfluencers,
                    keywords: _.toArray(newData.keywords)
                };
                toChange.twitterGroups = {$push: [twGroup]};
            }
        }
        else {
            toChange.twitterGroups = {
                $apply: item => {
                    if (item.name == groupName) {
                        item.name = newData.name;
                        item.influencers = _.uniq(_.toArray(newData.twInfluencers).map(val => val.toLocaleLowerCase()));
                        item.keywords = _.uniq(_.toArray(newData.keywords).map(val => val.toLocaleLowerCase()))
                    }
                }
            }
        }
        //same here
        if (igGroup === undefined) {
            if (newData.igInfluencers instanceof Array && newData.igInfluencers.length) {
                igGroup = {
                    name: newData.name,
                    influencers: newData.igInfluencers,
                    keywords: _.toArray(newData.keywords)
                };
                toChange.instagramGroups = {$push: [igGroup]};
            }
        }
        else {
            toChange.instagramGroups = {
                $apply: item => {
                    if (item.name == groupName) {
                        item.name = newData.name;
                        item.influencers = _.uniq(_.toArray(newData.igInfluencers).map(val => val.toLocaleLowerCase()));
                        item.keywords = _.uniq(_.toArray(newData.keywords).map(val => val.toLocaleLowerCase()))
                    }
                }
            }
        }
        if (Object.keys(toChange).length) {
            this.setState((state) => update(state, toChange), this.autosave);
        }
    }

    newGroup(e) {
        let name = this.state.newGroupName.trim();
        if (!name.length || this.groupExists(name))
            return false;
        this.setState((state) => update(state, {
            twitterGroups: {
                $push: [{
                    name,
                    "influencers": [],
                    "keywords": []
                }]
            },
            instagramGroups: {
                $push: [{
                    name,
                    "influencers": [],
                    "keywords": []
                }]
            },
            newGroupName: {
                $set: ''
            },
            newGroupInfluencer: {
                $set: ''
            },
            newGroupInfluencerType: {
                $set: 'twitter'
            },
            canAdd: {
                $set: false
            }
        }), this.autosave);

    }

    groupExists(groupName) {
        if (_.findWhere(this.state.instagramGroups, {name: groupName}) !== undefined)
            return true;
        return (_.findWhere(this.state.twitterGroups, {name: groupName}) !== undefined)
    }

    canAdd(groupName, influencerName) {
        return groupName.length > 0 && influencerName.length > 0 && !this.groupExists(groupName);
    }

    onGroupNameChange(e) {
        let newGroupName = e.target.value.replace(/^\s+/, '');
        this.setState({
            newGroupName,
            canAdd: this.canAdd(newGroupName, this.state.newGroupInfluencer)
        });
    }

    onGroupInfluencerChange(e) {
        let newGroupInfluencer = e.target.value.trim();
        this.setState({
            newGroupInfluencer,
            canAdd: this.canAdd(this.state.newGroupName, newGroupInfluencer)
        });
    }

    onGroupDelete(groupName) {
        this.setState((state) => update(state, {
            twitterGroups: {$set: _.reject(this.state.twitterGroups, group => (group.name == groupName))},
            instagramGroups: {$set: _.reject(this.state.instagramGroups, group => (group.name == groupName))}
        }), this.autosave);

    }

    keyHandler(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            this.newGroup(e);
        }
    }

    setNewGroupInfluencerType(type) {
        if (['instagram', 'twitter'].indexOf(type) > -1) {
            this.setState({
                newGroupInfluencerType: type
            });
            return true;
        }
        return false;
    }


    /**
     * @return {name, twitterList, instagramList, keywords}...
     */
    getMergedGroups() {
        let r = [];
        for (let group of this.state.instagramGroups) {
            r.push({
                name: group.name,
                instagramList: group.influencers,
                twitterList: [],
                keywords: group.keywords
            });
        }
        for (let group of this.state.twitterGroups) {
            let mergedGroup = _.findWhere(r, {name: group.name});
            if (mergedGroup !== undefined) {
                mergedGroup.twitterList = group.influencers;
                mergedGroup.keywords = _.uniq([...mergedGroup.keywords, ...group.keywords], false, str => str.toLocaleLowerCase())
            }
            else
                r.push({
                    name: group.name,
                    instagramList: [],
                    twitterList: group.influencers,
                    keywords: group.keywords
                });
        }
        return r;
    }

    render() {

        let listItems = this.getMergedGroups().map((value, index) =>
                (
                    <MatchGroup key={value.name} name={value.name}
                                expanded={index == 0}
                                twitterList={value.twitterList}
                                instagramList={value.instagramList}
                                keywords={value.keywords} onChange={this.updateGroup.bind(this, value.name)}
                                onDelete={this.onGroupDelete.bind(this, value.name)}/>
                )
            ) || '';

        return (
            <div className="match-groups">
                <div className="match-group-header">
                    My matching groups
                </div>
                <div className="match-group-new">
                    <form onKeyDown={this.keyHandler.bind(this)}>
                        <label>New group:</label>
                        <input type="text" value={this.state.newGroupName}
                               onChange={this.onGroupNameChange.bind(this)}/>
                        <label> with a
                            <span>{this.state.newGroupInfluencerType == 'twitter' ? " Twitter " : " Instagram "}</span>
                            influencer: </label>
                        <input type="text" value={this.state.newGroupInfluencer}
                               onChange={this.onGroupInfluencerChange.bind(this)}/>

                        <a href="javascript:;"
                           className={"fa fa-twitter " + (this.state.newGroupInfluencerType == 'twitter' ? 'active' : '')}
                           onClick={this.setNewGroupInfluencerType.bind(this, 'twitter')}>&nbsp;</a>
                        <a href="javascript:;"
                           className={"fa fa-instagram " + (this.state.newGroupInfluencerType == 'instagram' ? 'active' : '')}
                           onClick={this.setNewGroupInfluencerType.bind(this, 'instagram')}>&nbsp;</a>

                        { this.state.canAdd &&
                        <a href="javascript:;" className="fa fa-plus-circle"
                           onClick={this.newGroup.bind(this)}>&nbsp;</a>
                        }
                    </form>
                </div>
                <div className="match-group-list">
                    {listItems}
                </div>
            </div>
        );
    }


}

GroupList.propTypes = propTypes;

export default GroupList;

