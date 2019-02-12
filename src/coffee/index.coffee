$ = require 'jquery'

nextFrame = (fn) -> setTimeout(fn, 0)

teacherLeft = () ->
    $('.teachers > li').removeClass('focus')
    $('.teachers > li:nth-child(7)').addClass('focus')
    $('.teachers > li:nth-child(1)')
        .addClass('removing')
        .one 'transitionend', ->
            $('.teachers > li:nth-child(1)').appendTo('.teachers')
            nextFrame ->
                $('.teachers > li:nth-child(11)')
                    .removeClass('removing')
                    .one 'transitionend', ->
                        $('#teachers .left').one('click', teacherLeft)
    $('.teacher-infos > li:nth-child(1)').appendTo('.teacher-infos')

teacherRight = () ->
    $('.teachers > li').removeClass('focus')
    $('.teachers > li:nth-child(5)').addClass('focus')
    $('.teachers > li:nth-child(11)')
        .addClass('removing')
        .one 'transitionend', ->
            $('.teachers > li:nth-child(11)').prependTo('.teachers')
            nextFrame ->
                $('.teachers > li:nth-child(1)')
                    .removeClass('removing')
                    .one 'transitionend', ->
                        $('#teachers .right').one('click', teacherRight)
    $('.teacher-infos > li:nth-child(11)').prependTo('.teacher-infos')

$ ->
    $('.teachers > li:nth-child(6)').addClass('focus')
    $('#teachers .left').one('click', teacherLeft)
    $('#teachers .right').one('click', teacherRight)