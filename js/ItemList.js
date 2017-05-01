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
            value = value.replace(/\s+/, '').trim();
        else
            value = value.replace(/\s+/, ' ').replace('/^\s+', '');
        value = value.toLocaleLowerCase();
        if (/^\s+$/.test(value))
            value = '';
        e.target.value = value;
        this.setState({
            newValue: value,
            canAdd: this.props.onValidate(value)
        });
    }

    newItem(e) {
        let value = this.state.newValue.trim();
        if (this.state.canAdd && this.props.onAddToList instanceof Function)
            if (this.props.onAddToList(value) !== false) {
                this.setState({newValue: '', canAdd: false});
                return true;
            }
            else
                this.setState({newValue: value, canAdd: this.props.onValidate(value)});
        return false;
    }

    removeItem(value) {
        if (this.props.onRemoveFromList instanceof Function)
            if (this.props.onRemoveFromList(value)) {
                this.setState({newValue: value, canAdd: true});
            }
    }

    keyHandler(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            this.newItem(e);
        }
    }


    render() {
        let listItems = this.props.list.map((value) =>
            <li className="tag" key={value}>
                <a href="javascript:;" className="fa fa-times" tabIndex={-1}
                   onClick={this.removeItem.bind(this, value)}>&nbsp;</a>
                <span>{value}</span>
            </li>
        );
        return (
            <div className="item-list">
                <div className="item-list-title">{this.props.title}</div>
                <div className="item-list-add">
                    <form onKeyDown={this.keyHandler.bind(this)}>
                        <label>Add new: <input type="text" value={this.state.newValue}
                                               onChange={this.onChange.bind(this)}/></label>
                        {this.state.canAdd &&
                        <a href="javascript:;" tabIndex={-1} className="fa fa-plus"
                           onClick={this.newItem.bind(this)}>&nbsp;</a>
                        }
                    </form>
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

