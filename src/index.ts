import {Command, flags} from '@oclif/command'
import axios from 'axios'
import {orderBy} from 'lodash'
const asciichart = require('asciichart')
const Table = require('cli-table3')

class UkCovidStats extends Command {
  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
  }

  async run() {
    const rolloutUrl = 'https://coronavirus.data.gov.uk/api/v1/data?filters=areaName=United%2520Kingdom;areaType=overview&structure=%7B%22areaType%22:%22areaType%22,%22areaName%22:%22areaName%22,%22areaCode%22:%22areaCode%22,%22date%22:%22date%22,%22cumVaccinationFirstDoseUptakeByPublishDatePercentage%22:%22cumVaccinationFirstDoseUptakeByPublishDatePercentage%22,%22cumVaccinationSecondDoseUptakeByPublishDatePercentage%22:%22cumVaccinationSecondDoseUptakeByPublishDatePercentage%22%7D&format=json'

    const rolloutResponse = await axios.get(rolloutUrl)

    let rolloutData = orderBy(rolloutResponse.data.data, ['date', 'asc'])
    rolloutData = rolloutData.slice(Math.max(rolloutData.length - 30, 1))

    const rolloutTable = new Table({
      head: ['Date', 'First Dose %', 'Second Dose %'],
      colWidths: [15, 15, 16],
    })

    const firstDoseChart = new Array(rolloutData.length)
    const secondDoseChart = new Array(rolloutData.length)

    rolloutData.forEach((row: any, index: number) => {
      firstDoseChart[index] = row.cumVaccinationFirstDoseUptakeByPublishDatePercentage
      secondDoseChart[index] = row.cumVaccinationSecondDoseUptakeByPublishDatePercentage

      rolloutTable.push([row.date, row.cumVaccinationFirstDoseUptakeByPublishDatePercentage, row.cumVaccinationSecondDoseUptakeByPublishDatePercentage])
    })

    this.log('')
    this.log('Last 30 days of UK covid vaccine data')
    this.log('')
    this.log(rolloutTable.toString())

    this.log('')
    this.log('1st Dose Over Time')
    this.log('')
    this.log(asciichart.plot(firstDoseChart))

    this.log('')
    this.log('2nd Dose Over Time')
    this.log('')
    this.log(asciichart.plot(secondDoseChart))
  }
}

export = UkCovidStats
