import harmonize from './';
import component from './component';
import {OrderedMap, Map} from 'immutable';
import 'bulma/css/bulma.css';
import {hash} from './util';

const question = component({
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
    model: OrderedMap(surveyQuestions
        .map(question => ({hash: hash(question) + '', map: Map({value: 3})}))
        .reduce((obj, {hash, map}) => {
            obj[hash] = map;
            return obj;
        }, {})
    ),
    components: {question},
    view: ({model, update, h}) => {
        const total = (surveyQuestions
            .map(question => model.get(hash(question)).get('value'))
            .reduce((sum, value) => sum + value, 0)
        );

        return h('div', {
            ch: [h('h1', {ch: `Total: ${total}`}), h('div', {
                ch: surveyQuestions.map(question => h('question', {
                    pr: {question},
                    mo: hash(question)
                }))
            })]
        });
    }
});

harmonize({
    component: survey,
    selector: '#example'
});
