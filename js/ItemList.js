require('../sass/ItemList.scss');
import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    list: PropTypes.array.isRequired,
    title: PropTypes.string,
    spacesAllowed: PropTypes.bool,
    onAddToList: PropTypes.func.isRequired,
    onRemoveFromList: PropTypes.func.isRequired,
    onValidate: PropTypes.func.isRequired
};

/**
 * @property list
 * @property title
 * @property spacesAllowed
 * @property onAddToList
 * @property onRemoveFromList
 * @property onValidate
 */
class ItemList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newValue: '',
            canAdd: false
        };
    }


    onChange(e) {
        let value = e.target.value;
        if (this.props.spacesAllowed === false)
            value = value.trim();
        else
            value = value.replace('/^\s+', '');
        value = value.toLocaleLowerCase();
        this.setState({
            newValue: value,
            canAdd: this.props.onValidate(value)
        });
    }

    newItem(e) {
        if (this.state.canAdd && this.props.onAddToList instanceof Function)
            if (this.props.onAddToList(this.state.newValue.trim()) !== false) {
                this.setState({newValue: '', canAdd: false});
            }
        return false;
    }

    removeItem(value) {
        if (this.props.onRemoveFromList instanceof Function)
            this.props.onRemoveFromList(value);
    }


    render() {
        let listItems = this.props.list.map((value) =>
            <li className="tag" key={value}>
                <a href="javascript:;" className="fa fa-times"
                   onClick={this.removeItem.bind(this, value)}>&nbsp;</a>
                <span>{value}</span>
            </li>
        );
        return (
            <div className="item-list">
                <div className="item-list-title">{this.props.title}</div>
                <div className="item-list-add">
                    <label>Add new: <input type="text" value={this.state.newValue} onChange={this.onChange.bind(this)}/></label>
                    {this.state.canAdd &&
                    <a href="javascript:;" className="fa fa-plus" onClick={this.newItem.bind(this)}>&nbsp;</a>
                    }
                </div>
                <div className="item-list-items">
                    {this.props.list.length ? (
                            <ul>{listItems}</ul>
                        ) : (
                            <span className="empty">List is empty</span>
                        )
                    }
                </div>
            </div>
        );
    }


}

ItemList.propTypes = propTypes;

export default ItemList;

