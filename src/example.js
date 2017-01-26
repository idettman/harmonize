import harmonize from './';
import component from './component';
import {OrderedMap, Map, fromJS} from 'immutable';
import 'bulma/css/bulma.css';
import {hash} from './util';

const question = component({
    view: ({model, props, update, h, remove}) => {
        const responses = [
            [1, 'strongly disagree'],
            [2, 'disagree'],
            [3, 'undecided'],
            [4, 'agree'],
            [5, 'strongly agree']
        ];

        return h('div', {
            ch: [h('div', {
                ch: h('strong', {ch: model.get('question')})
            }),
            h('div', {ch: `model: ${model.get('value')}`}),
            h('div', {
                ch: responses.map(([value, response]) => h('label', {
                    ch: [h('input', {
                        on: {click: update(model => model.set('value', value))},
                        pr: {
                            type: 'radio',
                            name: hash(model.get('question')),
                            value,
                            checked: model.get('value') === value,
                        },
                    }), response]
                }))
            }), h('button', {
                on: {click: remove()},
                ch: 'x'
            })]
        });
    }
});

const surveyQuestions = [
    'You really agree',
    'You like this framework'
];

const survey = component({
    model: fromJS(surveyQuestions
        .map(question => ({hash: hash(question), question}))
        .reduce((obj, {hash, question}) => {
            obj[hash] = {question, value: 3};
            return obj;
        }, {})
    ),
    components: {question},
    view: ({model, update, h}) => {
        console.log('model', model && model.toJS());
        const total = (model.valueSeq()
            .map(model => model.get('value'))
            .reduce((sum, value) => sum + value, 0)
        );

        return h('div', {
            ch: [h('h1', {ch: `Total: ${total}`}), h('div', {
                ch: model.entrySeq().toArray().map(([hash, model]) => h('question', {
                    pr: {question: 'fewfew'},
                    mo: hash
                }))
            })]
        });
    }
});

harmonize({
    component: survey,
    selector: '#example'
});
