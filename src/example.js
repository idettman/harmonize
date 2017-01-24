import harmonize, {h} from './';
import component from './component';
import history from './history';
import route from './router';
import {fromJS, Record, OrderedMap, Map} from 'immutable';
const {random} = Math;
const toValue = event => event.target.value;
import 'bulma/css/bulma.css';
import {hash} from './util';

const question = component({
    name: 'question',
    view: ({model, props, update, h}) => {
        const responses = [
            [1, 'strongly disagree'],
            [2, 'disagree'],
            [3, 'undecided'],
            [4, 'agree'],
            [5, 'strongly agree']
        ];

        return h('div', {
            ch: [h('div', {
                ch: h('strong', {ch: props.question})
            }),
            h('div', {ch: `model: ${model.get('value')}`}),
            h('div', {
                ch: responses.map(([value, response]) => h('label', {
                    ch: [h('input', {
                        on: {click: update(model => model.set('value', value))},
                        pr: {
                            type: 'radio',
                            name: hash(props.question),
                            value,
                            checked: model.get('value') === value,
                        },
                    }), response]
                }))
            })]
        });
    }
});

const surveyQuestions = [
    'You really agree',
    'You like this framework'
];

const survey = component({
    name: 'survey',
    model: OrderedMap(surveyQuestions
        .map(question => ({hash: hash(question) + '', map: Map({value: 3})}))
        .reduce((obj, {hash, map}) => {
            obj[hash] = map;
            return obj;
        }, {})
    ),
    components: {question},
    view: ({model, update, h}) => {
        return h('div', {
            ch: surveyQuestions.map(question => h('question', {
                pr: {question},
                mo: hash(question) + ''
            }))
        });
    }
});

harmonize({
    component: survey,
    selector: '#example'
});
