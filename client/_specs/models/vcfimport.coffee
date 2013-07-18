describe 'vCard Import', ->

    Contact = require 'models/contact'
    ContactView = require 'views/contact'

    before ->
      polyglot = new Polyglot()
      polyglot.extend require 'locales/en'
      window.t = polyglot.t.bind polyglot

    VCFS =
        google: """
            BEGIN:VCARD
            VERSION:3.0
            N:Test;Cozy;;;
            FN:Cozy Test
            EMAIL;TYPE=INTERNET;TYPE=WORK:cozytest@cozycloud.cc
            EMAIL;TYPE=INTERNET;TYPE=HOME:cozytest2@cozycloud.cc
            TEL;TYPE=CELL:0600000000
            TEL;TYPE=WORK:0610000000
            ADR;TYPE=HOME:;;1 Sample Adress;PARIS;;75001;FRANCE
            ADR;TYPE=WORK:;;2 Sample Address;PARIS;;75002;FRANCE
            ORG:Cozycloud
            TITLE:Testeur Fou
            BDAY:1989-02-02
            item1.URL:http\\://test.example.com
            item1.X-ABLabel:PROFILE
            item2.EMAIL;TYPE=INTERNET:test3@example.com
            item2.X-ABLabel:truc
            item3.X-ABDATE:2013-01-01
            item3.X-ABLabel:_$!<Anniversary>!$_
            item4.X-ABRELATEDNAMES:Cozypouet
            item4.X-ABLabel:_$!<Friend>!$_
            NOTE:Something
            TITLE:CEO
            END:VCARD
        """

        android: """
            BEGIN:VCARD
            VERSION:2.1
            N:Test;Cozy;;;
            FN:Cozy Test
            NOTE:Something
            X-ANDROID-CUSTOM:vnd.android.cursor.item/nickname;Cozypseudo;1;;;;;;;;;;;;;
            TEL;CELL:060-000-0000
            EMAIL;WORK:cozytest@cozycloud.cc
            EMAIL;HOME:cozytest2@cozycloud.cc
            ADR;HOME:;;1 Sample Adress 75001 Paris;;;;
            ADR;HOME2:;;2 Sample Adress 75001 Paris;;;;
            ORG:Cozycloud
            TITLE:Testeur Fou
            X-ANDROID-CUSTOM:vnd.android.cursor.item/contact_event;2013-01-01;0;Date Perso;;;;;;;;;;;;
            X-ANDROID-CUSTOM:vnd.android.cursor.item/contact_event;2013-01-01;1;;;;;;;;;;;;;
            BDAY:1989-02-02
            X-ANDROID-CUSTOM:vnd.android.cursor.item/relation;Cozypouet;6;;;;;;;;;;;;;
            END:VCARD
        """

        apple: """
            BEGIN:VCARD
            VERSION:3.0
            N:Test;Cozy;;;
            FN:Cozy Test
            ORG:Cozycloud;
            TITLE:Testeur Fou
            EMAIL;type=INTERNET;type=WORK;type=pref:cozytest@cozycloud.cc
            EMAIL;type=INTERNET;type=HOME:cozytest2@cozycloud.cc
            TEL;type=CELL;type=pref:06 00 00 00 00
            TEL;type=CELL;type=WORK:06 00 00 00 00
            ADR;type=HOME;type=pref:;;43 rue blabla;Paris;;750000;France
            item1.ADR;type=WORK;type=pref:;;18 rue poulet;Paris;;75000;France
            item1.X-ABADR:fr
            BDAY;value=date:1999-02-01
            X-AIM;type=HOME;type=pref:cozypseudo
            item2.X-ABRELATEDNAMES;type=pref:Cozypouet
            item2.X-ABLabel:_$!<Friend>!$_
            X-ABUID:7EC63789-9F24-4F95-AF74-A85483437BC8\:ABPerson
            NOTE:Something
            END:VCARD
        """

    _.each VCFS, (vcf, vendor) ->

        it "should parse a #{vendor} vCard", ->

            contacts = Contact.fromVCF vcf

            expect(contacts.length).to.equal 1

            @contact = contacts.at 0

            expect(@contact.attributes).to.have.property 'fn', 'Cozy Test'


            dp = @contact.dataPoints.findWhere
                name: 'email'
                type: 'work'
                value: 'cozytest@cozycloud.cc'
            expect(dp).to.not.be.an 'undefined'


            dp = @contact.dataPoints.findWhere
                name: 'other'
                type: 'friend'
                value: 'Cozypouet'
            expect(dp).to.not.be.an 'undefined'

            dp = @contact.dataPoints.findWhere
                name: 'about'
                type: 'title'
                value: 'Testeur Fou'
            expect(dp).to.not.be.an 'undefined'

        it 'and the generated contact should not bug ContactView', ->
            view = new ContactView(model : @contact)
            $('#sandbox').append view.$el
            view.render()
            setTimeout ->
                view.remove()
                @contact = null
            , 50